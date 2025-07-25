# backend/routers/strategic-campaign-planner/strategy.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()

class StrategyRequest(BaseModel):
    businessGoals: List[str]
    demographics: List[str]
    interests: List[str]
    location: str
    budget: str
    timeline: str
    industry: str

class StrategyResponse(BaseModel):
    message: str
    summary: dict

@router.post("/generate-strategy", response_model=StrategyResponse)
def generate_strategy(data: StrategyRequest):
    if not data.businessGoals:
        raise HTTPException(status_code=400, detail="Business goals are required")

    summary = {
        "Goals": data.businessGoals,
        "Target Audience": {
            "Demographics": data.demographics,
            "Interests": data.interests,
            "Location": data.location
        },
        "Budget": f"${data.budget}/month",
        "Timeline": data.timeline,
        "Industry": data.industry,
        "Blueprint": f"We will launch a {data.industry.lower()} marketing campaign targeting {', '.join(data.demographics)} with an emphasis on {', '.join(data.businessGoals[:2])}. Budget: ${data.budget}/mo for {data.timeline}."
    }

    return StrategyResponse(
        message="Strategy generated successfully",
        summary=summary
    )
