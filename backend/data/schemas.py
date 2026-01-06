from pydantic import BaseModel, Field
import uuid
from fastapi_users import schemas
from typing import Optional
from datetime import datetime

class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=1000)
    parent_comment_id: uuid.UUID | None = None

class UserPublic(BaseModel):
    username: str
    profile_type: str
    organization: str
    headline: str

    class Config: #automatic pydantic validation with objects and JSON
        from_attributes = True

class Comment(BaseModel):  # Don't inherit from CommentCreate since the fields are different
    id: uuid.UUID
    post_id: uuid.UUID
    body: str
    parent_comment_id: uuid.UUID | None = None
    owner: UserPublic

class CommentUpdate(BaseModel):
    body: str

class Post(BaseModel):
    post_id: uuid.UUID
    url: str
    file_type: str
    file_name: str
    caption: str | None = None
    owner: UserPublic

    average_rating: float = 0.0
    vote_count: int = 0
    
    created_at: datetime

class UserRead(schemas.BaseUser[uuid.UUID]):
    username: str
    profile_type: str # "student" or "professional"
    organization: str # University or Company

    program: Optional[str] = None
    year_of_study: Optional[int] = None
    job_title: Optional[str] = None

class UserCreate(schemas.BaseUserCreate):
    username: str
    profile_type: str # "student" or "professional"
    organization: str # University or Company

    program: Optional[str] = None
    year_of_study: Optional[int] = None
    job_title: Optional[str] = None

class UserUpdate(schemas.BaseUserUpdate):
    pass
