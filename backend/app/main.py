from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import get_client, reset_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.mongo_client = get_client()
    yield
    reset_client()


from .routers import (
    admin,
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
    vision,
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

    application.include_router(auth.router)
    application.include_router(admin.router)
    application.include_router(vision.router)
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
