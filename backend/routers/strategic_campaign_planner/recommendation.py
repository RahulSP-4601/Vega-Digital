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
- Each event should include: name, date, location, and a relevance explanation.
- Weather impact should also describe how it helps or limits campaign performance (e.g., rain = more indoor/mobile engagement)

Your JSON must include:

1. "recommendedPlatforms": 4–6 best-fit ad platforms:
   - name
   - matchScore (0–100)
   - rationale (mention weather/event insights if relevant)
   - campaignTypes

2. "notRecommendedPlatforms": 2–4 platforms that are not ideal:
   - name
   - matchScore
   - rationale
   - campaignTypes

3. "keywords": {{
   "globalKeywords": [...],
   "localKeywords": [...]
}}

4. "competitors": 4 local competitors in {data.location} and 3 national ones:
   - name
   - shortDescription
   - estimatedMonthlyTraffic
   - marketingChannels
   - strength
   - weakness

5. "strategyTips": 3 suggestions for boosting results

6. "localContext": {{
   "weatherSummary": "Explain how the weather may affect business performance or visibility",
   "eventsSummary": [
      {{
        "name": "Event title",
        "date": "MM/DD/YYYY",
        "location": "Venue or city",
        "relevance": "Why this matters for this business"
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

        # Step 1: Strip ```json wrapper if present
        if raw_text.strip().startswith("```json"):
            raw_text = raw_text.strip()[7:-3].strip()
        elif raw_text.strip().startswith("```"):
            raw_text = raw_text.strip()[3:-3].strip()

        # Step 2: Extract JSON block safely
        json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not json_match:
            raise HTTPException(status_code=500, detail="No valid JSON found in response.")
        json_block = json_match.group(0)

        # Step 3: Clean and sanitize
        json_block = re.sub(r"\[\d+\]", "", json_block)  # Remove [1], [2]
        json_block = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*):', r'\1"\2":', json_block)  # Unquoted keys
        json_block = json_block.replace("‘", "'").replace("’", "'").replace("“", "\"").replace("”", "\"")  # Smart quotes
        json_block = re.sub(r"\\\"", "\"", json_block)  # De-escape double quotes
        json_block = re.sub(r",\s*(\}|\])", r"\1", json_block)  # Remove trailing commas

        print("\n✅ Cleaned JSON block:\n", json_block)

        # Step 4: Parse
        parsed = json.loads(json_block)

        # Step 5: Validate
        required_keys = [
            "recommendedPlatforms", "notRecommendedPlatforms", "keywords",
            "competitors", "strategyTips", "localContext"
        ]
        for k in required_keys:
            if k not in parsed:
                raise HTTPException(status_code=500, detail=f"Missing key in response: {k}")

        keywords = parsed["keywords"]
        if not isinstance(keywords, dict) or "globalKeywords" not in keywords or "localKeywords" not in keywords:
            raise HTTPException(status_code=500, detail="Missing or invalid 'keywords' structure")

        local_context = parsed["localContext"]
        if "weatherSummary" not in local_context or "eventsSummary" not in local_context:
            raise HTTPException(status_code=500, detail="Missing 'localContext' data")

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
        raise HTTPException(status_code=500, detail=f"Perplexity Error: 500: {str(e)}")
