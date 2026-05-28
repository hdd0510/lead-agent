"""POST /chat — main conversation endpoint."""
import asyncio
import logging
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.queries import (
    find_or_create_lead,
    get_lead_messages,
    get_active_rules,
    get_listing,
    append_message,
    update_lead_criteria,
    update_lead,
    get_lead_by_id,
)
from services.ai_engine import process_turn
from services.qualification import run_qualification_workflow, handle_escalation
from schemas.models import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    # Resolve lead: use lead_id shortcut if provided, else dedup by email/phone
    if req.lead_id:
        lead = await get_lead_by_id(req.lead_id, db)
        if lead is None:
            raise HTTPException(status_code=404, detail=f"Lead {req.lead_id} not found")
    else:
        lead = await find_or_create_lead(
            req.email, req.phone, req.channel, req.listing_id, req.name, db
        )

    # Fetch context in parallel
    messages_task = asyncio.create_task(get_lead_messages(lead.id, db))
    rules_task = asyncio.create_task(get_active_rules(db))
    listing_task = asyncio.create_task(
        get_listing(lead.listing_id, db) if lead.listing_id else asyncio.sleep(0, result=None)
    )
    messages, rules, listing = await asyncio.gather(messages_task, rules_task, listing_task)

    # Single GPT-4o call: reply + criteria + escalate
    try:
        turn = await process_turn(lead, req.message, messages, rules, listing)
    except Exception as exc:
        logger.error("process_turn failed for lead %s: %s", lead.id, exc)
        raise HTTPException(status_code=502, detail="AI engine error — please retry")

    # Persist user message then assistant reply
    await append_message(lead.id, "user", req.message, db)
    await append_message(lead.id, "assistant", turn.reply, db)
    updated_lead = await update_lead_criteria(lead.id, turn.criteria, db)

    # Handle escalation
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
        return ChatResponse(lead_id=lead.id, reply=turn.reply, escalated=True)

    # Check if all 4 criteria now collected and lead still active
    if updated_lead.criteria_collected >= 4 and updated_lead.status == "active":
        await update_lead(lead.id, {"status": "qualified"}, db)
        background_tasks.add_task(run_qualification_workflow, lead.id, db)

    return ChatResponse(lead_id=lead.id, reply=turn.reply, escalated=False)
