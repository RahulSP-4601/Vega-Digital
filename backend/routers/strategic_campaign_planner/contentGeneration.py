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

class ContentGenerationRequest(BaseModel):
    businessName: str
    businessDescription: str
    businessGoals: List[str]
    demographics: List[str]
    interests: List[str]
    location: str
    industry: str

@router.post("/generate-content")
def generate_content(data: ContentGenerationRequest):
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
You are a content strategist helping businesses create high-performing social media content.

Given the following business details, generate:

1. A recommended platform (e.g., Instagram, Facebook, LinkedIn) for marketing.
2. 3-4 short social media captions tailored for that platform, based on:
  - the business description
  - the goals
  - the audience demographics
  - industry
  - location

3. After each caption, explain why it works for that business and target audience.
4. Recommend hashtags relevant to each caption.

Return a clean JSON with:
{
  "recommendedPlatform": "Platform Name",
  "captions": [
    {
      "text": "...",
      "rationale": "...",
      "hashtags": ["...", "..."]
    },
    ...
  ]
}

Business Info:
- Name: {data.businessName}
- Description: {data.businessDescription}
- Goals: {goals}
- Demographics: {demographics}
- Interests: {interests}
- Location: {data.location}
- Industry: {data.industry}
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

        if raw_text.strip().startswith("```json"):
            raw_text = raw_text.strip()[7:-3].strip()
        elif raw_text.strip().startswith("```"):
            raw_text = raw_text.strip()[3:-3].strip()

        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not match:
            raise HTTPException(status_code=500, detail="No valid JSON found.")
        json_block = match.group(0)

        json_block = re.sub(r"\[\d+\]", "", json_block)
        json_block = json_block.replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"')
        json_block = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*):', r'"\2":', json_block)
        json_block = re.sub(r",\s*(\}|\])", r"\1", json_block)

        parsed = json.loads(json_block)

        if "recommendedPlatform" not in parsed or "captions" not in parsed:
            raise HTTPException(status_code=500, detail="Missing required fields in Perplexity output")

        return parsed

    except json.JSONDecodeError as jde:
        print("❌ JSON Decode Error:", jde)
        raise HTTPException(status_code=500, detail=f"Perplexity returned invalid JSON: {str(jde)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Perplexity Error: {str(e)}")
