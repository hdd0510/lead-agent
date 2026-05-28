"""HITL actions: approve, reject, send draft, confirm booking."""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.queries import get_lead_by_id, update_lead, append_message
from services.booking import confirm_booking, get_available_slots
from services.email_sender import send_email
from schemas.models import DraftRequest, BookingRequest, LeadDetail, MessageOut

logger = logging.getLogger(__name__)
router = APIRouter(tags=["actions"])


async def _get_lead_or_404(lead_id: str, db: AsyncSession):
    lead = await get_lead_by_id(lead_id, db)
    if lead is None:
        raise HTTPException(status_code=404, detail=f"Lead {lead_id} not found")
    return lead


@router.post("/leads/{lead_id}/approve")
async def approve_lead(lead_id: str, db: AsyncSession = Depends(get_db)):
    """Approve a pending lead. Triggers booking confirmation if slot chosen."""
    lead = await _get_lead_or_404(lead_id, db)
    await update_lead(lead_id, {"status": "approved"}, db)
    return {"ok": True, "lead_id": lead_id, "status": "approved"}


@router.post("/leads/{lead_id}/reject")
async def reject_lead(lead_id: str, db: AsyncSession = Depends(get_db)):
    """Reject a lead and append a closing message to the conversation."""
    await _get_lead_or_404(lead_id, db)
    await update_lead(lead_id, {"status": "rejected"}, db)
    await append_message(
        lead_id,
        "assistant",
        "Thank you for your interest. We'll keep your details on file and reach out if something suitable comes up.",
        db,
    )
    return {"ok": True, "lead_id": lead_id, "status": "rejected"}


@router.post("/leads/{lead_id}/draft")
async def send_draft(
    lead_id: str,
    body: DraftRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a (possibly edited) draft reply to the lead via their original channel."""
    lead = await _get_lead_or_404(lead_id, db)

    # Append the sent draft as an assistant message in the conversation
    await append_message(lead_id, "assistant", body.content, db)
    await update_lead(lead_id, {"status": "approved", "draft_reply": body.content}, db)

    # Attempt email delivery if lead has email address
    if lead.email:
        await send_email(
            to_email=lead.email,
            subject="Your property inquiry",
            body=body.content,
        )

    return {"ok": True, "lead_id": lead_id, "sent": True}


@router.post("/leads/{lead_id}/book")
async def book_slot(
    lead_id: str,
    body: BookingRequest,
    db: AsyncSession = Depends(get_db),
):
    """Confirm a viewing slot for the lead."""
    await _get_lead_or_404(lead_id, db)
    try:
        slot = await confirm_booking(lead_id, body.slot_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "lead_id": lead_id, "slot": slot}


@router.get("/slots")
async def list_slots():
    """Return available demo booking slots."""
    return get_available_slots()
