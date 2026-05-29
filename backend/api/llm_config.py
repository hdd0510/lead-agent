"""GET /config/llm, PUT /config/llm — runtime LLM provider configuration."""
from fastapi import APIRouter
from pydantic import BaseModel

from config import get_llm_config, set_llm_config, PROVIDER_BASE_URLS, PROVIDER_DEFAULT_MODELS

router = APIRouter(tags=["config"])


class LlmConfigOut(BaseModel):
    provider: str
    api_key: str
    model: str
    base_url: str


class LlmConfigIn(BaseModel):
    provider: str
    api_key: str
    model: str
    base_url: str = ""


@router.get("/config/llm", response_model=LlmConfigOut)
async def get_llm():
    cfg = get_llm_config()
    # Mask API key: show last 4 chars only
    key = cfg["api_key"]
    masked = ("*" * (len(key) - 4) + key[-4:]) if len(key) > 4 else "****"
    return LlmConfigOut(
        provider=cfg["provider"],
        api_key=masked,
        model=cfg["model"],
        base_url=cfg["base_url"],
    )


@router.put("/config/llm", response_model=LlmConfigOut)
async def update_llm(body: LlmConfigIn):
    set_llm_config(
        provider=body.provider,
        api_key=body.api_key,
        model=body.model,
        base_url=body.base_url,
    )
    cfg = get_llm_config()
    key = cfg["api_key"]
    masked = ("*" * (len(key) - 4) + key[-4:]) if len(key) > 4 else "****"
    return LlmConfigOut(
        provider=cfg["provider"],
        api_key=masked,
        model=cfg["model"],
        base_url=cfg["base_url"],
    )


@router.get("/config/llm/providers")
async def list_providers():
    """Return available providers with their defaults."""
    return [
        {"id": k, "base_url": v, "default_model": PROVIDER_DEFAULT_MODELS.get(k, "")}
        for k, v in PROVIDER_BASE_URLS.items()
    ] + [{"id": "custom", "base_url": "", "default_model": ""}]
