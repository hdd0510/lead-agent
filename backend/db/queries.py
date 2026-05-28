"""Typed async query helpers for all DB operations."""
from datetime import datetime
from typing import Optional
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Lead, Message, Rule, Listing
from services.ai_engine import CriteriaState


async def find_or_create_lead(
    email: Optional[str],
    phone: Optional[str],
    channel: str,
    listing_id: Optional[str],
    name: Optional[str],
    db: AsyncSession,
) -> Lead:
    """Dedup by email (primary) then phone (secondary). Creates new if not found."""
    lead = None

    if email:
        result = await db.execute(select(Lead).where(Lead.email == email))
        lead = result.scalar_one_or_none()

    if lead is None and phone:
        result = await db.execute(select(Lead).where(Lead.phone == phone))
        lead = result.scalar_one_or_none()

    if lead is None:
        lead = Lead(
            channel=channel,
            name=name,
            email=email,
            phone=phone,
            listing_id=listing_id,
        )
        db.add(lead)
        await db.flush()  # populate id without full commit

    return lead


async def get_lead_messages(lead_id: str, db: AsyncSession) -> list[Message]:
    """Return messages for a lead ordered by timestamp asc."""
    result = await db.execute(
        select(Message)
        .where(Message.lead_id == lead_id)
        .order_by(Message.timestamp.asc())
    )
    return list(result.scalars().all())


async def get_lead_with_messages(
    lead_id: str, db: AsyncSession
) -> tuple[Lead, list[Message]]:
    """Return (lead, messages) together."""
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if lead is None:
        raise ValueError(f"Lead not found: {lead_id}")
    messages = await get_lead_messages(lead_id, db)
    return lead, messages


async def append_message(
    lead_id: str, role: str, content: str, db: AsyncSession
) -> Message:
    """Append a user or assistant message to the conversation."""
    msg = Message(lead_id=lead_id, role=role, content=content)
    db.add(msg)
    await db.flush()
    return msg


async def update_lead(lead_id: str, fields: dict, db: AsyncSession) -> Lead:
    """Generic field update on a lead. Returns updated lead."""
    fields["updated_at"] = datetime.utcnow()
    await db.execute(update(Lead).where(Lead.id == lead_id).values(**fields))
    await db.flush()
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one()
    return lead


async def update_lead_criteria(
    lead_id: str, criteria: CriteriaState, db: AsyncSession
) -> Lead:
    """Merge new criteria into existing state. Never overwrites answered=True with False."""
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one()

    fields: dict = {}

    # Budget
    if criteria.budget.answered and not lead.criteria_budget:
        fields["criteria_budget"] = True
        if criteria.budget.range:
            fields["budget_range"] = criteria.budget.range

    # Timeline
    if criteria.timeline.answered and not lead.criteria_timeline:
        fields["criteria_timeline"] = True
        if criteria.timeline.months is not None:
            fields["timeline_months"] = criteria.timeline.months

    # Purpose
    if criteria.purpose.answered and not lead.criteria_purpose:
        fields["criteria_purpose"] = True
        if criteria.purpose.type:
            fields["purpose"] = criteria.purpose.type

    # Decision maker
    if criteria.decision_maker.answered and not lead.criteria_decision_maker:
        fields["criteria_decision_maker"] = True
        if criteria.decision_maker.is_sole is not None:
            fields["is_decision_maker"] = criteria.decision_maker.is_sole

    if fields:
        # Recalculate criteria_collected count
        new_budget = fields.get("criteria_budget", lead.criteria_budget)
        new_timeline = fields.get("criteria_timeline", lead.criteria_timeline)
        new_purpose = fields.get("criteria_purpose", lead.criteria_purpose)
        new_dm = fields.get("criteria_decision_maker", lead.criteria_decision_maker)
        fields["criteria_collected"] = sum(
            [bool(new_budget), bool(new_timeline), bool(new_purpose), bool(new_dm)]
        )
        fields["updated_at"] = datetime.utcnow()
        await db.execute(update(Lead).where(Lead.id == lead_id).values(**fields))
        await db.flush()
        result = await db.execute(select(Lead).where(Lead.id == lead_id))
        lead = result.scalar_one()

    return lead


async def get_active_rules(db: AsyncSession) -> list[Rule]:
    """Return all enabled rules ordered by creation date."""
    result = await db.execute(
        select(Rule).where(Rule.enabled == True).order_by(Rule.created_at.asc())
    )
    return list(result.scalars().all())


async def get_listing(listing_id: str, db: AsyncSession) -> Optional[Listing]:
    """Fetch a listing by id, returns None if not found."""
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    return result.scalar_one_or_none()


async def get_all_leads(db: AsyncSession) -> list[Lead]:
    """All non-active leads sorted HOT first then score desc."""
    result = await db.execute(
        select(Lead)
        .where(Lead.status != "active")
        .order_by(Lead.score.desc().nulls_last(), Lead.created_at.desc())
    )
    return list(result.scalars().all())


async def get_lead_by_id(lead_id: str, db: AsyncSession) -> Optional[Lead]:
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    return result.scalar_one_or_none()


async def delete_all_leads_and_messages(db: AsyncSession) -> None:
    """Used by demo reset — cascade deletes messages via FK."""
    await db.execute(delete(Message))
    await db.execute(delete(Lead))
    await db.flush()
