from .crud import make_crud_router

router = make_crud_router("community_posts", "/community/posts", "Community")
