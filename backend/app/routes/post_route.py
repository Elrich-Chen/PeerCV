from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from sqlalchemy.orm import joinedload

from data.db import Posts, get_async_session, User, Rating
from data.schemas import Post
from app.images import imagekit

from auth.users import auth_backend, current_active_user, fastapi_users

router = APIRouter()

@router.get("/", response_model=list[Post])
async def list_posts(
    session: AsyncSession = Depends(get_async_session),
) -> list[Post]:
    result = await session.execute(select(Posts).options(joinedload(Posts.user)))
    posts = result.scalars().all()
    return [
        Post(
            post_id=post.id,
            url=post.url,
            file_type=post.file_type,
            file_name=post.file_name,
            caption=post.caption,
            average_rating=post.average_rating,
            vote_count=post.vote_count,
            owner={
                "username":post.user.username,
                "profile_type":post.user.profile_type,
                "organization":post.user.organization,
                "headline": (
                    post.user.job_title  
                    if post.user.job_title 
                    else f"{post.user.program}, Year {post.user.year_of_study}"
                )
            },
            created_at=post.created_at
        )
        for post in posts
    ]

@router.get("/me", response_model=list[Post])
async def list_posts(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user)
) -> list[Post]:
    result = await session.execute(select(Posts).where(Posts.user_id == user.id).options(joinedload(Posts.user)))
    posts = result.scalars().all()

    if posts:
        return [
            Post(
                post_id=post.id,
                url=post.url,
                file_type=post.file_type,
                file_name=post.file_name,
                caption=post.caption,
                average_rating=post.average_rating,
                vote_count=post.vote_count,
                owner={
                    "username":post.user.username,
                    "profile_type":post.user.profile_type,
                    "organization":post.user.organization,
                    "headline": (
                        post.user.job_title  
                        if post.user.job_title 
                        else f"{post.user.program}, Year {post.user.year_of_study}"
                    )
                },
                created_at=post.created_at
            )
            for post in posts
        ]
    else:
        raise HTTPException(status_code=204, detail="No posts found")


@router.get("/queue", response_model=list[Post])
async def get_voting_queue(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user)
):
    stmt = (
        select(Posts)
        # "Line up the receipts next to the posts"
        .outerjoin(Rating, (Rating.post_id == Posts.id) & (Rating.user_id == user.id))
        # "Only keep the ones where the receipt is missing (None)"
        .where(Rating.post_id == None)
        .options(joinedload(Posts.user)) 
        .limit(30)
    )
    
    result = await session.execute(stmt)
    posts = result.scalars().all()
    
    # ... (Return your list[Post] manual object like before) ...
    # (I can paste the full return block if you need it again)
    return [
        Post(
            post_id=post.id,
            url=post.url,
            file_type=post.file_type,
            file_name=post.file_name,
            caption=post.caption,
            average_rating=post.average_rating,
            vote_count=post.vote_count,

            owner={
                "username": post.user.username,
                "profile_type": post.user.profile_type,
                "organization": post.user.organization,
                "headline": (
                    post.user.job_title 
                    if post.user.job_title 
                    else f"{post.user.program}, Year {post.user.year_of_study}"
                )
            },
            created_at=post.created_at
        )
        for post in posts
    ]

@router.get("/leaderboard", response_model=list[Post])
async def get_leaderboard(
    session: AsyncSession = Depends(get_async_session)
):
    stmt = (
        select(Posts)
        .order_by(Posts.average_rating.desc()) # Simple Sort!
        .options(joinedload(Posts.user))
        .limit(20)
    )
    
    result = await session.execute(stmt)
    posts = result.scalars().all()

    return [
        Post(
            post_id=post.id,
            url=post.url,
            file_type=post.file_type,
            file_name=post.file_name,
            caption=post.caption,
            average_rating=post.average_rating,
            vote_count=post.vote_count,

            owner={
                "username": post.user.username,
                "profile_type": post.user.profile_type,
                "organization": post.user.organization,
                "headline": (
                    post.user.job_title 
                    if post.user.job_title 
                    else f"{post.user.program}, Year {post.user.year_of_study}"
                )
            },
            created_at=post.created_at
        )
        for post in posts
    ]

@router.post("/upload", response_model=Post, status_code=201)
async def upload_post(
    file: UploadFile = File(...),
    caption: str = Form(""),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user)
) -> Post:
    allowed_types = {
        "application/pdf": "pdf",
        "application/msword": "doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    }

    content_type = file.content_type or ""
    filename = file.filename or ""
    filename_lower = filename.lower()

    if content_type not in allowed_types and not filename_lower.endswith(
        (".pdf", ".doc", ".docx")
    ):
        raise HTTPException(
            status_code=400,
            detail="Only PDF or Word (.doc, .docx) files are allowed",
        )

    file_type = allowed_types.get(content_type)
    if not file_type:
        if filename_lower.endswith(".pdf"):
            file_type = "pdf"
        elif filename_lower.endswith(".docx"):
            file_type = "docx"
        else:
            file_type = "doc"

    try:
        file_content = await file.read()

        if not file_content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        upload_result = imagekit.files.upload(
            file=file_content,
            file_name=filename or "upload",
            use_unique_file_name=True,
            tags=["backend-upload"],
            folder="/uploads",
        )

        if not upload_result.url or not upload_result.file_id:
            raise HTTPException(
                status_code=502, detail="ImageKit upload returned incomplete data"
            )

        post = Posts(
            caption=caption,
            url=upload_result.url,
            file_type=file_type,
            file_name=upload_result.name or filename or "upload",
            imagekit_file_id=upload_result.file_id,
            user_id=user.id,
            username=user.username
        )
        session.add(post)
        await session.commit()
        await session.refresh(post)

        return Post(
            post_id=post.id,
            url=post.url,
            file_type=post.file_type,
            file_name=post.file_name,
            caption=post.caption,
            average_rating=post.average_rating,
            vote_count=post.vote_count,
            owner={
                    "username":user.username,
                    "profile_type":user.profile_type,
                    "organization":user.organization,
                    "headline": (
                        user.job_title  
                        if user.job_title 
                        else f"{user.program}, Year {user.year_of_study}"
                    )
                },
            created_at=post.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{post_id}/rate", status_code=201)
async def upload_post(
    post_id: uuid.UUID,
    score: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user)
):
    # 1. CHECK: Has this user voted on this post before?
    existing_vote = await session.execute(
        select(Rating).where(Rating.user_id == user.id, Rating.post_id == post_id)
    )
    if existing_vote.scalars().first():
        raise HTTPException(status_code=400, detail="You have already voted on this post.")

    # 2. SIGN: Create the "Receipt"
    new_rating = Rating(user_id=user.id, post_id=post_id, score=score)
    session.add(new_rating)

    # 3. MATH: Atomic Update (The "Safe" Way)
    # New Average = ((Old Avg * Old Count) + New Score) / (Old Count + 1)
    stmt = (
        update(Posts)
        .where(Posts.id == post_id)
        .values(
            vote_count=Posts.vote_count + 1,
            average_rating=(
                (Posts.average_rating * Posts.vote_count) + score
            ) / (Posts.vote_count + 1)
        )
    )
    await session.execute(stmt)

    await session.commit()
    return {"message": "Vote registered"}
    


@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user)
):
    try:
        post_uuid = uuid.UUID(post_id)
        result = await session.execute(select(Posts).where(Posts.id == post_uuid))
        post = result.scalars().first()

        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        if user.id != post.user_id:
            raise HTTPException(status_code=403, detail="Post not found")

        if post.imagekit_file_id:
            imagekit.files.delete(post.imagekit_file_id)

        await session.delete(post)
        await session.commit()

        return {"success": True, "message": "Post deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
