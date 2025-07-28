# backend/ScriptGenerator.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import requests
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

class ScriptGenRequest(BaseModel):
    platform: str
    adType: str
    tone: str
    topic: str
    keyword: str
    cta: str
    campaignData: Dict[str, Any]  # This includes recommendation data, business info, etc.

@router.post("/generate-script")
def generate_ad_script(payload: ScriptGenRequest):
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing Perplexity API Key")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    business = payload.campaignData
    biz_name = business.get("businessName", "the business")
    location = business.get("location", "")
    city_state = location if isinstance(location, str) else f"{location.get('city', '')}, {location.get('state', '')}"

    prompt = f"""
You are a digital marketing scriptwriter.
Write a {payload.adType} script for {payload.platform} targeting the following audience:
- Business: {biz_name}
- Segment: {business.get('demographics', [])}
- Location: {city_state}
- Description: {business.get('businessDescription', '')}
- Topic: {payload.topic}
- Keyword: {payload.keyword}
- Tone: {payload.tone}
- CTA: {payload.cta}

The script should be creative, engaging, and personalized.
If it's a video script, structure it into: [Hook, Body, CTA].
If it's an image ad or single caption, make it snappy, clear, and focused on the CTA.
Return the response as plain text only, no JSON.
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

        final_script = response.json()["choices"][0]["message"]["content"]
        return {"script": final_script.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
