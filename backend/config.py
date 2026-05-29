from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # asyncpg URL: postgresql+asyncpg://user:pass@host/dbname
    DATABASE_URL: str
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = ""
    DEMO_MODE: bool = True

    # LLM provider defaults (overridable at runtime via /config/llm)
    LLM_PROVIDER: str = "openai"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o"
    LLM_BASE_URL: str = ""

    class Config:
        env_file = ".env"


settings = Settings()

# Runtime LLM config — overrides env defaults, reset on restart
_llm_runtime: dict = {}

PROVIDER_BASE_URLS = {
    "openai": "https://api.openai.com/v1",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
}

PROVIDER_DEFAULT_MODELS = {
    "openai": "gpt-4o",
    "gemini": "gemini-3.5-flash",
}


def get_llm_config() -> dict:
    """Return effective LLM config, merging env defaults with runtime overrides."""
    provider = _llm_runtime.get("provider") or settings.LLM_PROVIDER
    api_key = _llm_runtime.get("api_key") or settings.LLM_API_KEY
    model = _llm_runtime.get("model") or settings.LLM_MODEL
    base_url = _llm_runtime.get("base_url") or settings.LLM_BASE_URL or PROVIDER_BASE_URLS.get(provider, "")
    return {"provider": provider, "api_key": api_key, "model": model, "base_url": base_url}


def set_llm_config(provider: str, api_key: str, model: str, base_url: str = "") -> None:
    """Update runtime LLM config."""
    _llm_runtime["provider"] = provider
    _llm_runtime["api_key"] = api_key
    _llm_runtime["model"] = model
    _llm_runtime["base_url"] = base_url or PROVIDER_BASE_URLS.get(provider, "")
