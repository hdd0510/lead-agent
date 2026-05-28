from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o"
    # asyncpg URL: postgresql+asyncpg://user:pass@host/dbname
    DATABASE_URL: str
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = ""
    DEMO_MODE: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
