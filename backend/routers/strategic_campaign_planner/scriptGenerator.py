from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

class ScriptGenRequest(BaseModel):
    platform: str
    adType: str
    answers: Dict[str, str]
    campaignData: Dict[str, Any]

@router.post("/generate-script")
def generate_ad_script(payload: ScriptGenRequest):
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing Perplexity API Key")

    business = payload.campaignData
    biz_name = business.get("businessName", "the business")
    location = business.get("location", "")
    city_state = location if isinstance(location, str) else f"{location.get('city', '')}, {location.get('state', '')}"

    formatted_answers = "\n".join([f"{k.strip()}: {v.strip()}" for k, v in payload.answers.items()])

    prompt = f"""
You are a senior digital copywriter.

Use the following business info and user answers to generate a high-performing marketing script for the selected platform.

Business Name: {biz_name}
Location: {city_state}
Platform: {payload.platform}
Ad Type: {payload.adType}
Business Description: {business.get("businessDescription", "")}
Business Goals: {business.get("businessGoals", [])}
Demographics: {business.get("demographics", [])}

User Answers:
{formatted_answers}

Generate a compelling {payload.adType.lower()} for the platform. Make sure it suits the style and audience of the platform.

Return only the final script.
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

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


@router.post("/ask-questions")
def get_available_ad_types(payload: Dict[str, Any]):
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing Perplexity API Key")

    platform = payload.get("platform", "")
    business = payload.get("campaignData", {})
    description = business.get("businessDescription", "")
    goals = business.get("businessGoals", [])
    content_data = business.get("contentRecommendation", [])
    captions = []
    hashtags = []

    for item in content_data:
        if item.get("platform") == platform:
            for rec in item.get("recommendations", []):
                captions.append(rec.get("caption"))
                hashtags.extend(rec.get("hashtags", []))

    prompt = f"""
You are an expert digital strategist.

The user selected platform: {platform}
Business Description: {description}
Goals: {goals}

Past AI captions for this platform:
{captions}

Relevant Hashtags:
{hashtags}

Based on platform capabilities and business needs, recommend the top 1–3 ad types for this platform. Examples: "Video Ad", "Image Ad", "Text Post", "Event Page".

Return JSON only:
{{ "recommendedAdTypes": ["..."] }}
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers=headers,
            json={"model": "sonar-pro", "messages": [{"role": "user", "content": prompt}]}
        )
        content = response.json()["choices"][0]["message"]["content"]
        if content.strip().startswith("```json"):
            content = content.strip()[7:-3].strip()
        elif content.strip().startswith("```"):
            content = content.strip()[3:-3].strip()
        return json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Perplexity Error: {str(e)}")


@router.post("/ask-questions/{ad_type}")
def get_questions_for_ad_type(ad_type: str, payload: Dict[str, Any]):
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing Perplexity API Key")

    business = payload.get("campaignData", {})
    description = business.get("businessDescription", "")
    goals = business.get("businessGoals", [])
    platform = payload.get("platform", "")

    prompt = f"""
You are a senior marketing content strategist.

The user is creating a {ad_type} for {platform}.
Business Description: {description}
Goals: {goals}

Generate 3 to 5 clear and helpful questions to ask the user before generating the ad script. Make sure questions are relevant for a {ad_type}.

Return JSON only:
{{ "questions": [{{"question": "..."}}, ...] }}
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers=headers,
            json={"model": "sonar-pro", "messages": [{"role": "user", "content": prompt}]}
        )
        content = response.json()["choices"][0]["message"]["content"]
        if content.strip().startswith("```json"):
            content = content.strip()[7:-3].strip()
        elif content.strip().startswith("```"):
            content = content.strip()[3:-3].strip()
        return json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Perplexity Error: {str(e)}")
