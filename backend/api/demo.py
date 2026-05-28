"""POST /demo/reset, GET /demo/seed-status — demo management endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import Lead, Rule, Listing
from db.queries import delete_all_leads_and_messages
from seed.demo_data import seed_demo_scenarios, seed_all
from schemas.models import DemoResetResponse, SeedStatusResponse
from config import settings

router = APIRouter(tags=["demo"])


@router.post("/demo/reset", response_model=DemoResetResponse)
async def demo_reset(db: AsyncSession = Depends(get_db)):
    """Wipe all leads/messages, re-insert 3 demo scenarios. Keeps rules + listings."""
    if not settings.DEMO_MODE:
        raise HTTPException(status_code=403, detail="Not in demo mode")

    await delete_all_leads_and_messages(db)
    await seed_demo_scenarios(db)
    await db.commit()
    return DemoResetResponse(ok=True, message="Demo reset complete — 3 scenarios restored")


@router.post("/demo/seed", response_model=DemoResetResponse)
async def demo_seed(db: AsyncSession = Depends(get_db)):
    """Full seed: listings + rules + demo scenarios (safe to run multiple times)."""
    if not settings.DEMO_MODE:
        raise HTTPException(status_code=403, detail="Not in demo mode")

    await seed_all(db)
    return DemoResetResponse(ok=True, message="Seed complete")


@router.get("/demo/seed-status", response_model=SeedStatusResponse)
async def seed_status(db: AsyncSession = Depends(get_db)):
    """Return counts of seeded data for health-check / UI banner."""
    lead_count = (await db.execute(select(func.count()).select_from(Lead))).scalar_one()
    rule_count = (await db.execute(select(func.count()).select_from(Rule))).scalar_one()
    listing_count = (await db.execute(select(func.count()).select_from(Listing))).scalar_one()

    return SeedStatusResponse(
        seeded=listing_count > 0,
        lead_count=lead_count,
        rule_count=rule_count,
        listing_count=listing_count,
    )
