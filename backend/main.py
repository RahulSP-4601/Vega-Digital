from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.strategic_campaign_planner import (
    strategy,
    recommendation,
    competitor,
    trends,
    scriptGenerator  # ✅ New import
)

app = FastAPI(
    title="Vega Digital API",
    description="Marketing Campaign Planner powered by Gemini + Perplexity",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://vega-digital.netlify.app" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Register routers
app.include_router(strategy.router, prefix="/strategy", tags=["Strategy"])
app.include_router(recommendation.router, prefix="/recommendation", tags=["Recommendation"])
app.include_router(scriptGenerator.router, prefix="/script", tags=["Script Generator"])  # ✅ New line
# app.include_router(competitor.router, prefix="/competitor", tags=["Competitor"])
# app.include_router(trends.router, tags=["Market Trends"])
