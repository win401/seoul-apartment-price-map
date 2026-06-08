from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.recommender import MovieRecommender
from app.schemas import RecommendRequest

app = FastAPI(title="Few-Shot Movie Recommendation Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3013",
        "http://127.0.0.1:3013",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

recommender = MovieRecommender()


@app.get("/health")
def health():
    return {"ok": True, "indexedReviews": recommender.total_reviews}


@app.post("/recommend")
def recommend(payload: RecommendRequest):
    profile = payload.preference_profile.model_dump() if payload.preference_profile else None
    return recommender.recommend(payload.query, payload.top_k, profile)
