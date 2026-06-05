from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import TextRecommendRequest
from app.service import recommend_menus

app = FastAPI(title="Menu Recommender Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3012",
        "http://127.0.0.1:3012",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/recommend/text")
def recommend_text(payload: TextRecommendRequest):
    return recommend_menus(payload.query)


# Image recommendation is intentionally paused for now.
# It can be restored after the text recommendation + food information flow is stable.
#
# from fastapi import File, UploadFile
# from app.schemas import ImageRecommendationResponse
# from app.vision import analyze_food_image
#
# @app.post("/recommend/image", response_model=ImageRecommendationResponse)
# async def recommend_image(file: UploadFile = File(...)):
#     image_bytes = await file.read()
#     analysis = analyze_food_image(
#         file.filename or "uploaded-food-image",
#         file.content_type,
#         image_bytes,
#     )
#     candidate_names = [] if analysis.detectedName == "알 수 없음" else [analysis.detectedName]
#     recommendation = recommend_menus(analysis.query, candidate_names=candidate_names)
#     return ImageRecommendationResponse(
#         analysis=analysis,
#         recommendation=recommendation,
#     )
