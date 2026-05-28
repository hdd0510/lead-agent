"""POST /webhook/email — Sendgrid Inbound Parse webhook handler."""
import logging
from fastapi import APIRouter, Form, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.queries import find_or_create_lead, get_lead_messages, get_active_rules, append_message, update_lead_criteria, update_lead
from services.ai_engine import process_turn
from services.qualification import run_qualification_workflow, handle_escalation

logger = logging.getLogger(__name__)
router = APIRouter(tags=["webhook"])


@router.post("/webhook/email")
async def email_webhook(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    # Sendgrid Inbound Parse posts multipart/form-data fields
    from_email: str = Form(..., alias="from"),
    subject: str = Form(default=""),
    text: str = Form(default=""),
):
    """
    Handles Sendgrid Inbound Parse POST.
    Extracts sender email + body text, then runs the same conversation
    pipeline as /chat.
    """
    message_body = text.strip()
    if not message_body:
        return {"ok": True, "skipped": "empty body"}

    # Strip quoted reply chains (naive: take text before first "On ... wrote:")
    if "\nOn " in message_body:
        message_body = message_body.split("\nOn ")[0].strip()

    lead = await find_or_create_lead(
        email=from_email,
        phone=None,
        channel="email",
        listing_id=None,
        name=None,
        db=db,
    )

    messages = await get_lead_messages(lead.id, db)
    rules = await get_active_rules(db)

    try:
        turn = await process_turn(lead, message_body, messages, rules, listing=None)
    except Exception as exc:
        logger.error("Email webhook: process_turn failed for %s: %s", from_email, exc)
        return {"ok": False, "error": "AI engine error"}

    await append_message(lead.id, "user", message_body, db)
    await append_message(lead.id, "assistant", turn.reply, db)
    updated_lead = await update_lead_criteria(lead.id, turn.criteria, db)

    if turn.escalate.triggered:
        idx = turn.escalate.matched_rule_index
        triggered_rule = (
            rules[idx] if idx is not None and 0 <= idx < len(rules) else None
        )
        background_tasks.add_task(
            handle_escalation,
            updated_lead,
            turn.escalate.reason or "rule triggered",
            triggered_rule,
            db,
        )
        return {"ok": True, "lead_id": lead.id, "escalated": True}

    if updated_lead.criteria_collected >= 4 and updated_lead.status == "active":
        await update_lead(lead.id, {"status": "qualified"}, db)
        background_tasks.add_task(run_qualification_workflow, lead.id, db)

    return {"ok": True, "lead_id": lead.id, "reply": turn.reply}
