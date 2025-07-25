from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import List
import google.generativeai as genai
import json
import re
import requests
from requests.auth import HTTPBasicAuth

load_dotenv()
router = APIRouter()

class TrendRequest(BaseModel):
    businessName: str
    businessDescription: str
    industry: str
    location: str

@router.post("/market-trends")
async def get_trending_keywords(req: TrendRequest):
    try:
        gemini_key = os.getenv("GEMINI_API_KEY")
        dfseo_user = os.getenv("DFSEO_LOGIN")
        dfseo_pass = os.getenv("DFSEO_PASSWORD")

        if not gemini_key or not dfseo_user or not dfseo_pass:
            raise HTTPException(status_code=500, detail="Missing API credentials")

        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""
        You are an AI marketing strategist. Based on the business information below, generate a list of top 20 trending and relevant marketing keywords.

        - Business Name: {req.businessName}
        - Description: {req.businessDescription}
        - Industry: {req.industry}
        - Location: {req.location}

        Return ONLY a valid JSON list like this:
        {{
          "keywords": ["keyword 1", "keyword 2", "keyword 3", ...]
        }}
        """

        response = model.generate_content(prompt)
        content = response.text.strip()
        print("🔍 Gemini raw keyword response:\n", content)

        match = re.search(r'\{.*\}', content, re.DOTALL)
        if not match:
            raise HTTPException(status_code=500, detail="Gemini Error: No valid JSON found")

        keyword_block = match.group()
        result = json.loads(keyword_block)

        if "keywords" not in result or not isinstance(result["keywords"], list):
            raise HTTPException(status_code=500, detail="Gemini Error: Malformed keyword list")

        keywords = result["keywords"][:5]
        print("✅ Parsed keywords:", keywords)

        task_payload = {
            "keywords": keywords,
            "language_code": "en",
            "location_code": 2840
        }

        dfseo_response = requests.post(
            "https://api.dataforseo.com/v3/keywords_data/google/search_volume/live",
            auth=HTTPBasicAuth(dfseo_user, dfseo_pass),
            json=[task_payload]
        )

        if dfseo_response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"DataForSEO Error: {dfseo_response.text}")

        dfseo_json = dfseo_response.json()
        print("📦 DataForSEO raw response:\n", json.dumps(dfseo_json, indent=2))

        items = dfseo_json.get("tasks", [])[0].get("result", [])[0].get("items", [])

        validated_keywords = []
        for item in items:
            validated_keywords.append({
                "keyword": item.get("keyword"),
                "volume": item.get("search_volume", 0),
                "cpc": round(item.get("cpc", 0.0), 2) if item.get("cpc") else 0.0,
                "competition": round(item.get("competition", 0.0), 2) if item.get("competition") else 0.0
            })

        validated_keywords.sort(key=lambda x: x["volume"], reverse=True)
        return { "keywords": validated_keywords }

    except Exception as e:
        print("❌ Error in /market-trends:", str(e))
        raise HTTPException(status_code=500, detail=f"Gemini/DataForSEO Error: {str(e)}")
