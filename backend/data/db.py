from collections.abc import AsyncGenerator
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Float
from sqlalchemy import UUID
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship
from fastapi_users.db import SQLAlchemyUserDatabase, SQLAlchemyBaseUserTableUUID
from fastapi import Depends
from sqlalchemy import event

import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL=os.environ.get("DATABASE_URL")
#connecting to a local test databse
if not DATABASE_URL:
    raise RuntimeError("DATABASE IS NOT SET")

class Base(DeclarativeBase):
    pass

class Posts(Base):
    __tablename__ = "posts"
    id = Column(UUID(as_uuid=True), primary_key=True, nullable=False, default=uuid.uuid4)
    caption = Column(Text)
    url = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    imagekit_file_id = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    username = Column(String, nullable=False)

    vote_count = Column(Integer, default=0, nullable=False)
    average_rating = Column(Float, default=0.0, nullable=False)

    #defining relationships
    user = relationship("User", back_populates="posts")
    comments = relationship("Comments", back_populates="post", cascade="all, delete-orphan")

class Comments(Base):
    __tablename__ = "comments"
    id = Column(UUID(as_uuid=True), primary_key=True, nullable=False, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    body = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    username = Column(String, nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)

    #defining relationships for python
    user = relationship("User", back_populates="comments")
    post = relationship("Posts", back_populates="comments")

class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"
    username = Column(String, nullable=False)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)  # ADD THIS LINE

    #more rich fields
    profile_type = Column(String, nullable=True)     # "student" or "professional"
    organization = Column(String, nullable=True)     # University or Company
    
    program = Column(String, nullable=True)          # e.g. "Computer Science"
    year_of_study = Column(Integer, nullable=True)   # e.g. 2
    job_title = Column(String, nullable=True)        # e.g. "Senior Dev"

    #defining relationships
    posts = relationship("Posts", back_populates="user")
    comments = relationship("Comments", back_populates="user")
    

class Rating(Base):
    __tablename__ = "ratings"
    # Composite Primary Key: The pair of (user + post) must be unique
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id"), primary_key=True)
    score = Column(Integer, nullable=False) # 1 to 5


engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True
    )

if engine.url.drivername == "sqlite":
    @event.listens_for(engine.sync_engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session

async def get_user_db(session: AsyncSession=Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User) #this takes in a session and uses our User model for querying
    #sqlachemy provides an adapter object, converting between the datahase and provide various methods