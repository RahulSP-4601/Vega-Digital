from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import requests
import os
from dotenv import load_dotenv
import json
import re

load_dotenv()
router = APIRouter()

def sanitize_text(text):
    return text.encode('utf-8', 'surrogatepass').decode('utf-8', 'ignore')

class RecommendationRequest(BaseModel):
    businessName: str
    businessDescription: str
    businessGoals: List[str]
    demographics: List[str]
    interests: List[str]
    location: str
    industry: str

@router.post("/generate-recommendation")
def generate_recommendation(data: RecommendationRequest):
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing Perplexity API Key")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    goals = ", ".join(data.businessGoals)
    demographics = ", ".join(data.demographics)
    interests = ", ".join(data.interests)

    prompt = f"""
You are a digital advertising strategist and campaign planner with access to real-time weather and event data.

Your goal is to recommend 3–5 personalized ad platforms that are highly relevant for the business below, and also list 2–3 ad platforms that are not suitable. Base your recommendations on:
1. Their goals, industry, and target location
2. The current weather forecast in that location
3. Only relevant local events — NOT general ones

Each recommended platform must include:
- name
- matchScore (0–100)
- rationale
- campaignTypes

Each not recommended platform must include:
- name
- matchScore (0–100)
- rationale

Your JSON must include:

"recommendedPlatforms": [{{ name, matchScore, rationale, campaignTypes }}],
"notRecommendedPlatforms": [{{ name, matchScore, rationale }}],
"keywords": {{
   "globalKeywords": ["..."],
   "localKeywords": ["..."]
}},
"competitors": [{{ name, description, estimatedMonthlyTraffic, marketingChannels, strength, weakness }}],
"strategyTips": ["...", "...", "..."],
"localContext": {{
   "weatherSummary": "...",
   "eventsSummary": [{{ name, date, location, relevance }}]
}}

Business Info:
- Name: {data.businessName}
- Description: {data.businessDescription}
- Goals: {goals}
- Demographics: {demographics}
- Interests: {interests}
- Location: {data.location}
- Industry: {data.industry}

Return valid JSON only.
"""

    try:
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers=headers,
            json={
                "model": "sonar-pro",
                "messages": [{"role": "user", "content": sanitize_text(prompt)}]
            }
        )

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Perplexity Error: {response.text}")

        raw_text = response.json()["choices"][0]["message"]["content"]
        print("\n📦 Perplexity raw response:\n", raw_text)

        if raw_text.strip().startswith("```json"):
            raw_text = raw_text.strip()[7:-3].strip()
        elif raw_text.strip().startswith("```"):
            raw_text = raw_text.strip()[3:-3].strip()

        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not match:
            raise HTTPException(status_code=500, detail="No valid JSON found.")
        json_block = match.group(0)

        json_block = re.sub(r"\[\d+\]", "", json_block)
        json_block = json_block.replace("‘", "'").replace("’", "'").replace("“", "\"").replace("”", "\"")
        json_block = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*):', r'\1"\2"\3:', json_block)
        json_block = re.sub(r",\s*(\}|\])", r"\1", json_block)

        print("\n✅ Cleaned JSON block:\n", json_block)

        parsed = json.loads(json_block)

        for k in ["recommendedPlatforms", "notRecommendedPlatforms", "keywords", "competitors", "strategyTips", "localContext"]:
            if k not in parsed:
                raise HTTPException(status_code=500, detail=f"Missing key: {k}")

        if not isinstance(parsed["keywords"], dict):
            raise HTTPException(status_code=500, detail="Invalid keywords")

        local_ctx = parsed["localContext"]
        if "weatherSummary" not in local_ctx or "eventsSummary" not in local_ctx:
            raise HTTPException(status_code=500, detail="Missing weatherSummary/eventsSummary")

        if not isinstance(local_ctx["eventsSummary"], list):
            raise HTTPException(status_code=500, detail="eventsSummary should be a list")

        for event in local_ctx["eventsSummary"]:
            if isinstance(event, dict):
                loc = event.get("location")
                if isinstance(loc, str):
                    city = loc.split(",")[0].strip() if "," in loc else loc.strip()
                    state = loc.split(",")[1].strip() if "," in loc else ""
                    event["location"] = {
                        "street": "",
                        "city": city,
                        "state": state,
                        "zip": "",
                    }
                loc = event["location"]
                if isinstance(loc, dict) and "mapsLink" not in loc:
                    address = f"{loc.get('street', '')}, {loc.get('city', '')}, {loc.get('state', '')} {loc.get('zip', '')}"
                    maps_url = f"https://www.google.com/maps/dir/?api=1&destination={requests.utils.quote(address)}"
                    loc["mapsLink"] = maps_url
                    event["location"] = loc

        print("\n📌 Parsed eventsSummary:\n", local_ctx["eventsSummary"])

        content_prompt = f"""
You are an AI content strategist.

For each of the following ad platforms, generate 3 individual content recommendation sets.

Each set should include:
- a caption
- an explanation of why it works for the business
- relevant hashtags (as an array)

Output JSON format:
[
  {{
    "platform": "Instagram",
    "recommendations": [
      {{
        "caption": "...",
        "explanation": "...",
        "hashtags": ["...", "..."]
      }},
      ...
    ]
  }},
  ...
]

Business Description:
{data.businessDescription}

Recommended Platforms:
{[p['name'] for p in parsed['recommendedPlatforms']]}
"""

        content_response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers=headers,
            json={
                "model": "sonar-pro",
                "messages": [{"role": "user", "content": sanitize_text(content_prompt)}]
            }
        )

        if content_response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Content Generation Error: {content_response.text}")

        content_text = content_response.json()["choices"][0]["message"]["content"]
        print("\n🧠 Content Recommendation Raw Response:\n", content_text)

        if content_text.strip().startswith("```json"):
            content_text = content_text.strip()[7:-3].strip()
        elif content_text.strip().startswith("```"):
            content_text = content_text.strip()[3:-3].strip()

        content_text = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*):', r'\1"\2"\3:', content_text)
        content_text = re.sub(r",\s*(\}|\])", r"\1", content_text)

        content_recommendation = json.loads(content_text)

        return {
            "recommendedPlatforms": parsed["recommendedPlatforms"],
            "notRecommendedPlatforms": parsed["notRecommendedPlatforms"],
            "keywords": parsed["keywords"],
            "competitors": parsed["competitors"],
            "strategyTips": parsed["strategyTips"],
            "localContext": parsed["localContext"],
            "contentRecommendation": content_recommendation
        }

    except json.JSONDecodeError as jde:
        print("❌ JSON Decode Error:", jde)
        with open("broken_llm_output.json", "w") as f:
            f.write(raw_text)
        raise HTTPException(status_code=500, detail=f"Perplexity returned invalid JSON: {str(jde)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Perplexity Error: {str(e)}")