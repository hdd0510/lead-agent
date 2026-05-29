"""Qualification workflow and escalation handler (background tasks)."""
import asyncio
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from db.queries import get_lead_with_messages, update_lead, append_message
from services.scoring import score_lead
from services.booking import propose_booking_if_hot
from db.models import Lead, Rule

logger = logging.getLogger(__name__)


async def run_qualification_workflow(lead_id: str, db: AsyncSession) -> None:
    """
    Fire-and-forget after all 4 criteria collected.
    Steps: score → update lead → if HOT propose booking slots.
    """
    try:
        lead, messages = await get_lead_with_messages(lead_id, db)
        score = await score_lead(lead, messages)

        await update_lead(lead_id, {
            "score": score.total_score,
            "label": score.label,
            "score_reasoning": score.reasoning,
            "conversation_summary": score.conversation_summary,
            "suggested_next_action": score.suggested_next_action,
            "status": "pending_approval",
        }, db)
        logger.info("Lead %s scored %s (%d)", lead_id, score.label, score.total_score)

        if score.label == "HOT":
            await propose_booking_if_hot(lead, db)

        await db.commit()

    except Exception as exc:
        logger.error("Qualification workflow failed for lead %s: %s", lead_id, exc)
        await db.rollback()


async def handle_escalation(
    lead: Lead,
    reason: str,
    triggered_rule: Optional[Rule],
    db: AsyncSession,
) -> None:
    """
    Background task: generate a draft reply for the agent and update lead status.
    Uses GPT-4o to write a context-aware draft based on the conversation.
    """
    try:
        from openai import AsyncOpenAI
        from config import get_llm_config

        cfg = get_llm_config()
        client = AsyncOpenAI(api_key=cfg["api_key"], base_url=cfg["base_url"] or None)
        _, messages = await get_lead_with_messages(lead.id, db)

        conversation = "\n".join(f"{m.role.upper()}: {m.content}" for m in messages[-6:])
        rule_desc = triggered_rule.description if triggered_rule else reason

        prompt = (
            f"A real estate lead needs human follow-up. Triggered reason: '{rule_desc}'.\n\n"
            f"Recent conversation:\n{conversation}\n\n"
            "Write a short, professional draft reply the agent can send to the lead. "
            "Be warm, acknowledge their question, and offer to assist personally. 3-4 sentences max."
        )

        response = await client.chat.completions.create(
            model=cfg["model"],
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=200,
        )
        draft = response.choices[0].message.content or ""

        updates: dict = {
            "status": "pending_approval",
            "draft_reply": draft,
        }
        if triggered_rule:
            updates["triggered_rule_id"] = triggered_rule.id

        await update_lead(lead.id, updates, db)
        await db.commit()
        logger.info("Escalation draft generated for lead %s", lead.id)

    except Exception as exc:
        logger.error("Escalation handler failed for lead %s: %s", lead.id, exc)
        await db.rollback()
