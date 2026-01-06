from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from sqlalchemy.orm import joinedload

from data.db import Comments, get_async_session, User
from data.schemas import Comment, CommentCreate

from auth.users import auth_backend, current_active_user, fastapi_users

router = APIRouter()


@router.get("/{post_id}", response_model=list[Comment])
async def list_comments(
    post_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
) -> list[Comment]:
    result = await session.execute(select(Comments).where(Comments.post_id == post_id).options(joinedload(Comments.user)))
    comments = result.scalars().all()
    return [
        Comment(
            post_id=comment.post_id,  
            body=comment.body, 
            id=comment.id,
            parent_comment_id=comment.parent_id,
            owner={
                    "username":comment.user.username,
                    "profile_type":comment.user.profile_type,
                    "organization":comment.user.organization,
                    "headline": (
                        comment.user.job_title  
                        if comment.user.job_title 
                        else f"{comment.user.program}, Year {comment.user.year_of_study}"
                    )
                }
        )
        for comment in comments
    ]


@router.post("/{post_id}", response_model=Comment, status_code=201)
async def create_comment(
    post_id: uuid.UUID,
    comment: CommentCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user) #goes inside db and then checks if active, has access to header
) -> Comment:
    if comment.parent_comment_id:
        parent_check = await session.execute(
            select(Comments).where(Comments.id == comment.parent_comment_id)
        )
        if not parent_check.scalars().first():
            raise HTTPException(status_code=400, detail="The comment you are replying to does not exist.")
        
    to_add = Comments(
        post_id=post_id,
        body=comment.body,
        user_id=user.id,
        username=user.username,
        parent_id=comment.parent_comment_id
    )

    session.add(to_add)
    await session.commit()
    await session.refresh(to_add)

    return Comment(
        post_id=to_add.post_id,
        body=to_add.body,
        id=to_add.id,
        parent_comment_id=to_add.parent_id,
        owner={
                    "username":user.username,
                    "profile_type":user.profile_type,
                    "organization":user.organization,
                    "headline": (
                        user.job_title  
                        if user.job_title 
                        else f"{user.program}, Year {user.year_of_study}"
                    )
                }
    )


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    try:
        comment_uuid = uuid.UUID(comment_id)

        result = await session.execute(
            select(Comments).where(Comments.id == comment_uuid)
        )

        comment = result.scalars().first()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        if comment.user_id != user.id:
            raise HTTPException(status_code=403, detail="You dont have permission to delete this post")
        
        await session.delete(comment)
        await session.commit()

        return {"success": True, "message": "Comment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
