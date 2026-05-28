"""Seed helpers: listings, rules, and demo scenarios for the DB."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from db.models import Lead, Message, Rule, Listing
from seed.demo_scenarios import (
    SCENARIO_A_LEAD, SCENARIO_A_MESSAGES,
    SCENARIO_B_LEAD, SCENARIO_B_MESSAGES,
    SCENARIO_C_LEAD, SCENARIO_C_MESSAGES,
)

# ---------------------------------------------------------------------------
# Static fixtures
# ---------------------------------------------------------------------------

DEMO_LISTINGS = [
    {
        "id": "le-marais-apt",
        "title": "Le Marais Apartment",
        "price": 350000,
        "bedrooms": 2,
        "area": "Paris 3e",
        "description": "65m² apartment in Le Marais. Renovated kitchen, south-facing balcony.",
        "features": '["Parking included", "South balcony", "Stone building", "3rd floor"]',
    },
    {
        "id": "bastille-studio",
        "title": "Bastille Studio",
        "price": 180000,
        "bedrooms": 0,
        "area": "Paris 11e",
        "description": "28m² studio, 5 min from Bastille metro.",
        "features": '["No parking", "High ceilings", "Exposed brick"]',
    },
    {
        "id": "republique-family",
        "title": "République Family Home",
        "price": 650000,
        "bedrooms": 4,
        "area": "Paris 10e",
        "description": "140m² townhouse with private garden.",
        "features": '["Private garden", "4 bedrooms", "Cellar included"]',
    },
]

DEMO_RULES = [
    {"description": "Escalate when lead asks for a price reduction or negotiation", "action": "escalate"},
    {"description": "Escalate when lead asks about commission rates", "action": "escalate"},
    {"description": "Draft-only mode for investment leads", "action": "draft"},
    {"description": "Escalate when budget is above €500,000 EUR", "action": "escalate"},
]

# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

async def _upsert_listings(db: AsyncSession) -> None:
    for data in DEMO_LISTINGS:
        existing = await db.get(Listing, data["id"])
        if existing is None:
            db.add(Listing(**data))
    await db.flush()


async def _upsert_rules(db: AsyncSession) -> None:
    count = (await db.execute(select(func.count()).select_from(Rule))).scalar_one()
    if count == 0:
        for data in DEMO_RULES:
            db.add(Rule(**data))
        await db.flush()


async def _insert_scenario(
    lead_data: dict,
    messages: list[tuple[str, str]],
    db: AsyncSession,
) -> None:
    """Insert a single scenario lead + messages. Skips if lead id already exists."""
    existing = await db.get(Lead, lead_data["id"])
    if existing is not None:
        return

    db.add(Lead(**lead_data))
    await db.flush()

    for role, content in messages:
        db.add(Message(lead_id=lead_data["id"], role=role, content=content))
    await db.flush()

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def seed_demo_scenarios(db: AsyncSession) -> None:
    """Insert the 3 demo scenario leads + messages (idempotent by lead id)."""
    await _insert_scenario(SCENARIO_A_LEAD, SCENARIO_A_MESSAGES, db)
    await _insert_scenario(SCENARIO_B_LEAD, SCENARIO_B_MESSAGES, db)
    await _insert_scenario(SCENARIO_C_LEAD, SCENARIO_C_MESSAGES, db)


async def seed_all(db: AsyncSession) -> None:
    """Full seed: listings + rules + demo scenarios. Safe to run multiple times."""
    await _upsert_listings(db)
    await _upsert_rules(db)
    await seed_demo_scenarios(db)
    await db.commit()
