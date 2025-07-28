# backend/ScriptGenerator.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
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
    length: Optional[str] = None
    sceneStart: Optional[str] = None
    weather: Optional[str] = None
    numCharacters: Optional[str] = None
    mainProduct: Optional[str] = None
    campaignData: Dict[str, Any]

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

    if payload.adType == "Video Ad":
        prompt = f"""
You are a professional digital ad scriptwriter.

Write a {payload.length} {payload.adType} script for {payload.platform}.
The goal is to promote {payload.mainProduct} for {biz_name}.

Use the following context:
- Target Audience: {business.get('demographics', [])}
- Business Description: {business.get('businessDescription', '')}
- Topic: {payload.topic}
- Keyword: {payload.keyword}
- Tone: {payload.tone}
- CTA: {payload.cta}
- Weather in scene: {payload.weather}
- Scene starts with: {payload.sceneStart}
- Number of characters: {payload.numCharacters}
- Location: {city_state}

Structure the script in three clear parts:
1. HOOK (to grab attention visually and emotionally)
2. BODY (explaining value or product use)
3. CTA (strong ending with user action)

Output only the script as plain text.
"""
    else:
        prompt = f"""
You are a professional copywriter.

Write an engaging and persuasive image ad caption for {payload.platform}.

Use the following details:
- Business: {biz_name}
- Description: {business.get('businessDescription', '')}
- Audience: {business.get('demographics', [])}
- Location: {city_state}
- Topic: {payload.topic}
- Keyword: {payload.keyword}
- Tone: {payload.tone}
- CTA: {payload.cta}

Make sure it's sharp, clear, and scroll-stopping.
Return only the image caption as plain text.
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

        result = response.json()
        final_script = result["choices"][0]["message"]["content"]
        return {"script": final_script.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
