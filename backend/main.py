"""FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import create_tables
from api import health, chat, leads, rules, actions, email_webhook, demo

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (idempotent — Alembic handles migrations in prod)
    await create_tables()
    yield


app = FastAPI(
    title="Lead Agent API",
    description="AI-powered real estate lead qualification backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(leads.router)
app.include_router(rules.router)
app.include_router(actions.router)
app.include_router(email_webhook.router)
app.include_router(demo.router)
