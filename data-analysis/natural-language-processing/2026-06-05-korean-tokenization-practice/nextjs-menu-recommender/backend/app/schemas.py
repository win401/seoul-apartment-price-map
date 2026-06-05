from pydantic import BaseModel


class TextRecommendRequest(BaseModel):
    query: str = "해장 잘되는 음식"


class FoodInfo(BaseModel):
    calories: int
    servingSize: str
    difficulty: str
    cookingTime: str
    recipeSteps: list[str]
    nutritionNotes: list[str]


class MenuRecommendation(BaseModel):
    id: str
    name: str
    category: str
    description: str
    score: float
    tfidfScore: float
    intentScore: float
    matchedIntents: list[str]
    keywords: list[str]
    foodInfo: FoodInfo


class RecommendationResponse(BaseModel):
    query: str
    generatedAt: str
    totalMenus: int
    tokenizedQuery: list[str]
    expandedQuery: list[str]
    results: list[MenuRecommendation]


class ImageAnalysis(BaseModel):
    provider: str
    detectedName: str
    confidence: float
    visualKeywords: list[str]
    query: str
    note: str


class ImageRecommendationResponse(BaseModel):
    analysis: ImageAnalysis
    recommendation: RecommendationResponse
