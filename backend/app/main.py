from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.routes.comment_route import router as comments_router
from app.routes.post_route import router as posts_router
from data.db import create_db_and_tables
from fastapi.middleware.cors import CORSMiddleware
from auth.users import auth_backend, current_active_user, fastapi_users

from data.schemas import UserCreate, UserRead, UserUpdate

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_db_and_tables()
    yield

app = FastAPI(title="Commenting Feature", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(comments_router, prefix="/comments", tags=["comments"])
app.include_router(posts_router, prefix="/posts", tags=["posts"])

#auth connections
app.include_router(fastapi_users.get_auth_router(auth_backend), prefix='/auth/jwt', tags=["auth"])
app.include_router(fastapi_users.get_register_router(UserRead, UserCreate), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_reset_password_router(), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_verify_router(UserRead), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_users_router(UserRead, UserUpdate), prefix="/users", tags=["users"])
