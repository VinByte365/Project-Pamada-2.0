from .crud import make_crud_router

router = make_crud_router("profit_reports", "/reports", "Reports")
