from .crud import make_crud_router

router = make_crud_router("comments", "/comments", "Comments")
