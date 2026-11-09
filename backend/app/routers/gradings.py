from .crud import make_crud_router

router = make_crud_router("gradings", "/gradings", "Gradings")
