# backend/ScriptGenerator.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
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
    contactNumber: Optional[str] = None  # Keep this for editing later
    website: Optional[str] = None        # Keep this for editing later
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

Create a 10-second commercial script for {payload.platform}.
Purpose: Promote {payload.mainProduct} for {biz_name} in {city_state}.

Include:
- Timestamps like "0–4 sec: Scene 1", "5–10 sec: Scene 2"
- Describe the scene visually and who says what.
- Use cinematic, engaging, natural language.
- Make it creative and concise.
- Avoid contact number and website mentions. The user will edit that later.

Inputs:
- Scene Start: {payload.sceneStart}
- Weather: {payload.weather}
- Characters: {payload.numCharacters}
- Tone: {payload.tone}
- Keyword: {payload.keyword}
- CTA: {payload.cta}
- Audience: {business.get('demographics', [])}
- Business Description: {business.get('businessDescription', '')}

Structure:
0–4 sec: Scene 1 [description + dialogue]
4–7 sec: Scene 2 [description + dialogue]
8–10 sec: Scene 3 or CTA conclusion

Return only the script as plain text.
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
