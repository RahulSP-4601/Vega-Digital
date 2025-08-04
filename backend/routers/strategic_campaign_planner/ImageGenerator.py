import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import requests
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

class ImageAdRequest(BaseModel):
    campaignData: Dict[str, Any]
    scriptQA: Dict[str, str]
    script: str

@router.post("/generate-image-ad")
def generate_image_ad(req: ImageAdRequest):
    try:
        campaign = req.campaignData
        qa = req.scriptQA
        script = req.script

        business_name = campaign.get("businessName", "the business")
        description = campaign.get("businessDescription", "")
        goals = campaign.get("businessGoals", [])
        goal_text = ", ".join(goals) if isinstance(goals, list) else str(goals)

        def get_value_by_keywords(keywords):
            for question, answer in qa.items():
                if any(keyword in question.lower() for keyword in keywords):
                    return answer
            return ""

        offer = get_value_by_keywords(["product", "offer", "service"])
        target_audience = get_value_by_keywords(["audience", "target"])
        cta = get_value_by_keywords(["action", "cta", "after seeing the ad"])
        seasonal_theme = get_value_by_keywords(["season", "promotion", "limited"])
        brand_style = get_value_by_keywords(["brand", "style", "color", "logo", "font"])

        prompt = f"""
Create a professional, realistic, high-quality Instagram image ad for a business. Don't use AI character or avtars images. 

Business Name: {business_name}
Description: {description}
Product/Offer: {offer}
Target Audience: {target_audience}
Campaign Goals: {goal_text}
Primary Action (CTA): {cta}
Seasonal/Promotional Theme: {seasonal_theme}
Brand Style (optional): {brand_style}
Message Preview: "{script[:120]}..."
Visual Style: realistic photography, soft lighting, clean layout, high resolution, space for text overlays.
Avoid: embedded text in image.
Format: square, 1024x1024
"""

        headers = {
            "Authorization": f"Bearer {os.getenv('STABILITY_API_KEY')}",
            "Accept": "application/json"
        }


        files = {
            'prompt': (None, prompt.strip()),
            'model': (None, "stable-diffusion-xl-1024-v1-0"),
            'output_format': (None, "png"),
            'aspect_ratio': (None, "1:1")
        }

        response = requests.post(
            "https://api.stability.ai/v2beta/stable-image/generate/core",
            headers=headers,
            files=files
        )

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Stability API Error: {response.text}")

        image_url = response.json().get("image")
        if not image_url:
            raise HTTPException(status_code=500, detail="No image URL returned from Stability AI.")

        return {"imageUrl": image_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stability AI Error: {str(e)}")