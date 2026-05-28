"""Booking slot management and HOT lead slot proposal."""
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from db.queries import append_message, update_lead

DEMO_SLOTS = [
    {"id": "slot-1", "label": "Thursday, Jun 5 · 2:00 PM"},
    {"id": "slot-2", "label": "Friday, Jun 6 · 10:00 AM"},
    {"id": "slot-3", "label": "Saturday, Jun 7 · 11:00 AM"},
]


def get_available_slots() -> list[dict]:
    return DEMO_SLOTS


async def propose_booking_if_hot(lead, db: AsyncSession) -> None:
    """Append slot proposal assistant message after HOT scoring."""
    slots_text = "\n".join(f"• {s['label']}" for s in DEMO_SLOTS)
    msg = (
        "Great news — based on our conversation, I'd love to arrange a viewing for you.\n\n"
        f"Here are some available times:\n{slots_text}\n\n"
        "Which works best for you?"
    )
    await append_message(lead.id, "assistant", msg, db)


async def confirm_booking(lead_id: str, slot_id: str, db: AsyncSession) -> dict:
    """Confirm a slot for the lead and update status to booked."""
    slot: Optional[dict] = next(
        (s for s in DEMO_SLOTS if s["id"] == slot_id), None
    )
    if slot is None:
        raise ValueError(f"Unknown slot id: {slot_id}")

    await update_lead(lead_id, {"status": "booked", "booked_slot": datetime.utcnow()}, db)
    confirm_msg = (
        f"Perfect! Your viewing is confirmed for {slot['label']}. "
        "You'll receive a reminder the day before."
    )
    await append_message(lead_id, "assistant", confirm_msg, db)
    return slot
