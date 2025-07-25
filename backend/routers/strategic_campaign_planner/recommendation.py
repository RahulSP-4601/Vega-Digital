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

1. "recommendedPlatforms": 4–6 best-fit ad platforms
2. "notRecommendedPlatforms": 2–4 platforms that are not ideal
3. "keywords": {{
   "globalKeywords": [...],
   "localKeywords": [...]
}}
4. "competitors": 4 local competitors in {data.location} and 3 national ones
5. "strategyTips": 3 suggestions for boosting results
6. "localContext": {{
   "weatherSummary": "...",
   "eventsSummary": [
     {{
       "name": "...",
       "date": "...",
       "location": "...",
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

        # Step 1: Strip ```json wrapper
        if raw_text.strip().startswith("```json"):
            raw_text = raw_text.strip()[7:-3].strip()
        elif raw_text.strip().startswith("```"):
            raw_text = raw_text.strip()[3:-3].strip()

        # Step 2: Extract block
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not match:
            raise HTTPException(status_code=500, detail="No valid JSON found.")
        json_block = match.group(0)

        # Step 3: Normalize and deeply quote unquoted keys
        json_block = re.sub(r"\[\d+\]", "", json_block)  # Remove [1], [2]
        json_block = json_block.replace("‘", "'").replace("’", "'").replace("“", "\"").replace("”", "\"")

        # ✅ FIX: Quote all unquoted keys using a stricter regex (deep fix)
        json_block = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*):', r'\1"\2"\3:', json_block)

        # Remove trailing commas
        json_block = re.sub(r",\s*(\}|\])", r"\1", json_block)

        print("\n✅ Cleaned JSON block:\n", json_block)

        parsed = json.loads(json_block)

        for k in ["recommendedPlatforms", "notRecommendedPlatforms", "keywords", "competitors", "strategyTips", "localContext"]:
            if k not in parsed:
                raise HTTPException(status_code=500, detail=f"Missing key: {k}")

        if not isinstance(parsed["keywords"], dict):
            raise HTTPException(status_code=500, detail="Invalid keywords")

        if "weatherSummary" not in parsed["localContext"] or "eventsSummary" not in parsed["localContext"]:
            raise HTTPException(status_code=500, detail="Missing weatherSummary/eventsSummary")

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
