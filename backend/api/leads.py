"""GET /leads, GET /leads/{lead_id} — dashboard data endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.queries import get_all_leads, get_lead_by_id, get_lead_messages
from schemas.models import LeadSummary, LeadDetail, MessageOut

router = APIRouter(tags=["leads"])


@router.get("/leads", response_model=list[LeadSummary])
async def list_leads(db: AsyncSession = Depends(get_db)):
    """Return all non-active leads sorted by score desc (HOT first)."""
    leads = await get_all_leads(db)
    return [LeadSummary.model_validate(lead) for lead in leads]


@router.get("/leads/{lead_id}", response_model=LeadDetail)
async def get_lead(lead_id: str, db: AsyncSession = Depends(get_db)):
    """Return full lead detail including conversation messages."""
    lead = await get_lead_by_id(lead_id, db)
    if lead is None:
        raise HTTPException(status_code=404, detail=f"Lead {lead_id} not found")

    messages = await get_lead_messages(lead_id, db)
    # Build dict from column values only to avoid lazy-loading lead.messages relationship
    lead_data = {k: v for k, v in lead.__dict__.items() if not k.startswith('_')}
    lead_data['messages'] = [MessageOut.model_validate(m) for m in messages]
    return LeadDetail.model_validate(lead_data)
