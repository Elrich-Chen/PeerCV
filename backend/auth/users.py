#JWT AUTHENTICATION
import os
import uuid
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin, models
from fastapi_users.authentication import (AuthenticationBackend, BearerTransport, JWTStrategy)
from fastapi_users.db import SQLAlchemyUserDatabase

from data.db import User, get_user_db
from data.schemas import UserCreate, UserRead, UserUpdate

load_dotenv()
SECRET = os.getenv("JWT_SECRET")
if not SECRET:
    raise RuntimeError("JWT_SECRET is not set")

#interacting with user auth and database (python and database)
#BaseUserManager needs a user database adapter that can perform lookups etc
class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]): #[UserModel, ID]
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def on_after_register(self, user, request = None):
        return await super().on_after_register(user, request)
    
    async def on_after_forgot_password(self, user, token, request = None):
        return await super().on_after_forgot_password(user, token, request)
    
    async def on_after_request_verify(self, user, token, request = None):
        return await super().on_after_request_verify(user, token, request)

async def get_user_manager(user_db: SQLAlchemyUserDatabase=Depends(get_user_db)):
    yield UserManager(user_db) #each time this is called, then we pass in session and the ability to interact with it

##############
#bearer is like a concert ticket given for authentication
#send in the HTTP request as (Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
#tokenURL is where clients go to get a token
#the bearer method specifically puts it in the HTTP request inside the header
bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")


#bearer transport is stateless but get_jwt_strategy is a factory function (dependency injection)

#creates a token to represent an authenticated session
#token: header, payload, signature
#the signature is what gets checked as we perform computation on payload
def get_jwt_strategy():
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)

auth_backend = AuthenticationBackend(name="jwt",
                                     transport=bearer_transport,
                                     get_strategy=get_jwt_strategy)

#first parameter is how to connect to a database
#list of auth backends we can pass into our orchestrator
fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

#this returns a dependency function from the orchestrator
current_active_user = fastapi_users.current_user(active=True)
