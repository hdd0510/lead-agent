#!/bin/sh
set -e

echo "Waiting for Postgres..."
python - <<'PY'
import asyncio
import sys

from sqlalchemy import text

from db.database import engine


async def wait_for_db() -> None:
    for attempt in range(30):
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            print("Postgres is ready")
            return
        except Exception as exc:
            print(f"  attempt {attempt + 1}/30: {exc}")
            await asyncio.sleep(2)
    print("Postgres did not become ready in time", file=sys.stderr)
    sys.exit(1)


asyncio.run(wait_for_db())
PY

echo "Creating tables and seeding demo data..."
python - <<'PY'
import asyncio

from db.database import AsyncSessionLocal, create_tables
from seed.demo_data import seed_all


async def init_db() -> None:
    await create_tables()
    async with AsyncSessionLocal() as db:
        await seed_all(db)


asyncio.run(init_db())
PY

echo "Starting API on :8000"
exec uvicorn main:app --host 0.0.0.0 --port 8000
