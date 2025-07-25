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

Your goal is to recommend personalized ad platforms for the business below by combining:
1. Their goals, industry, and target location
2. The current weather forecast in that location
3. Only relevant local events — NOT general ones. Show only events that are directly useful for this business based on their industry or interests.

Be specific:

Each event must include:
- name
- date
- location: {{
    street,
    city,
    state,
    zip,
    mapsLink (Google Maps URL to exact venue),
    eventWebsite (if available)
  }}
- relevance: A brief explanation of why this event is relevant to the business

Your JSON must include:

1. "recommendedPlatforms": [
    {{
      "name": "Platform Name",
      "matchScore": number (0–100),
      "rationale": "Why this is a good fit for the business",
      "campaignTypes": ["Video Ads", "Display Ads", "Podcast Ads", ...]
    }}
  ]

2. "notRecommendedPlatforms": [
    {{
      "name": "Platform Name",
      "matchScore": number (0–100),
      "rationale": "Why this platform is not suitable for this business"
    }}
  ]

3. "keywords": {{
   "globalKeywords": [...],
   "localKeywords": [...]
}}

4. "competitors": [
  {{
    "name": "Competitor Name",
    "description": "What they do",
    "estimatedMonthlyTraffic": "Number or N/A",
    "marketingChannels": ["Facebook", "Google Ads", ...],
    "strength": "What they do well",
    "weakness": "What they lack"
  }}
]

5. "strategyTips": 3 suggestions for boosting results

6. "localContext": {{
   "weatherSummary": "...",
   "eventsSummary": [
     {{
       "name": "...",
       "date": "...",
       "location": {{
         "street": "...",
         "city": "...",
         "state": "...",
         "zip": "...",
         "mapsLink": "...",
         "eventWebsite": "..."
       }},
       "relevance": "..."
     }}
   ]
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
                "messages": [{"role": "user", "content": prompt}]
            }
        )

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Perplexity Error: {response.text}")

        raw_text = response.json()["choices"][0]["message"]["content"]
        print("\n📦 Perplexity raw response:\n", raw_text)

        # Strip ```json or ``` wrappers
        if raw_text.strip().startswith("```json"):
            raw_text = raw_text.strip()[7:-3].strip()
        elif raw_text.strip().startswith("```"):
            raw_text = raw_text.strip()[3:-3].strip()

        # Extract JSON block
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not match:
            raise HTTPException(status_code=500, detail="No valid JSON found.")
        json_block = match.group(0)

        # Normalize quotes and keys
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

        # Auto-generate mapsLink if missing
        for event in local_ctx["eventsSummary"]:
            loc = event.get("location", {})
            if "mapsLink" not in loc or not loc["mapsLink"]:
                address = f"{loc.get('street', '')}, {loc.get('city', '')}, {loc.get('state', '')} {loc.get('zip', '')}"
                maps_url = f"https://www.google.com/maps/dir/?api=1&destination={requests.utils.quote(address)}"
                loc["mapsLink"] = maps_url
                event["location"] = loc

        return {
            "recommendedPlatforms": parsed["recommendedPlatforms"],
            "notRecommendedPlatforms": parsed["notRecommendedPlatforms"],
            "keywords": parsed["keywords"],
            "competitors": parsed["competitors"],
            "strategyTips": parsed["strategyTips"],
            "localContext": parsed["localContext"]
        }

    except json.JSONDecodeError as jde:
        print("❌ JSON Decode Error:", jde)
        with open("broken_llm_output.json", "w") as f:
            f.write(raw_text)
        raise HTTPException(status_code=500, detail=f"Perplexity returned invalid JSON: {str(jde)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Perplexity Error: {str(e)}")
