from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import get_client

logger = logging.getLogger("farmsystem.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.mongo_client = get_client()
    yield
    app.state.mongo_client.close()


from .routers import (
    auth,
    chat,
    comments,
    community,
    diagnoses,
    farms,
    gradings,
    maturity,
    plants,
    reports,
    sensors,
    sync,
)


def create_app() -> FastAPI:
    application = FastAPI(title=settings.app_name, lifespan=lifespan)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def log_unexpected_model_requests(request: Request, call_next):
        if request.url.path == "/v1/models":
            logger.debug(
                "Ignored OpenCode /v1/models probe from %s",
                request.client.host if request.client else "unknown",
            )
        return await call_next(request)

    application.include_router(auth.router)
    application.include_router(chat.router)
    application.include_router(farms.router)
    application.include_router(plants.router)
    application.include_router(diagnoses.router)
    application.include_router(maturity.router)
    application.include_router(gradings.router)
    application.include_router(sensors.router)
    application.include_router(reports.router)
    application.include_router(community.router)
    application.include_router(comments.router)
    application.include_router(sync.router)

    @application.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()

