from pydantic import BaseModel, Field
from typing import Optional


class PreferenceProfile(BaseModel):
    mood: str = ""
    genre: str = ""
    ending: str = ""
    avoid: str = ""


class RecommendRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=300)
    top_k: int = Field(5, ge=3, le=10)
    preference_profile: Optional[PreferenceProfile] = None
