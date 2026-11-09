from fastapi import APIRouter, Depends

from ..dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me")
async def me(user=Depends(get_current_user)):
    user = dict(user)
    if "_id" in user:
        user["id"] = str(user.pop("_id"))
    return user
