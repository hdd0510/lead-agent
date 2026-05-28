"""Core AI engine: process_turn() calls GPT-4o with structured outputs."""
import asyncio
import logging
from typing import Optional
from openai import AsyncOpenAI, APIError, RateLimitError
from pydantic import BaseModel

from config import settings
from db.models import Lead, Message, Rule, Listing

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 1.0  # seconds, doubles each retry


# ---------------------------------------------------------------------------
# Structured output schemas (returned by GPT-4o via .parse())
# ---------------------------------------------------------------------------

class CriteriaField(BaseModel):
    answered: bool
    range: Optional[str] = None        # budget: e.g. "200-400k"
    has_ready_funds: Optional[bool] = None  # budget
    months: Optional[int] = None       # timeline
    type: Optional[str] = None         # purpose: 'primary_residence'|'investment'|'unclear'
    is_sole: Optional[bool] = None     # decision_maker


class CriteriaState(BaseModel):
    budget: CriteriaField
    timeline: CriteriaField
    purpose: CriteriaField
    decision_maker: CriteriaField


class EscalateState(BaseModel):
    triggered: bool
    reason: Optional[str] = None
    matched_rule_index: Optional[int] = None  # -1 means no match


class TurnOutput(BaseModel):
    reply: str
    criteria: CriteriaState
    escalate: EscalateState


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def process_turn(
    lead: Lead,
    new_message: str,
    messages: list[Message],
    rules: list[Rule],
    listing: Optional[Listing],
) -> TurnOutput:
    """Call GPT-4o once and get reply + criteria state + escalation in one shot."""
    from services.prompts import build_system_prompt

    system_prompt = build_system_prompt(listing, rules)
    history = [{"role": m.role, "content": m.content} for m in messages]

    for attempt in range(_MAX_RETRIES):
        try:
            response = await client.beta.chat.completions.parse(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    *history,
                    {"role": "user", "content": new_message},
                ],
                response_format=TurnOutput,
                temperature=0.7,
            )
            result = response.choices[0].message.parsed
            if result is None:
                raise ValueError("OpenAI returned null parsed output")
            return result

        except (RateLimitError, APIError) as exc:
            if attempt == _MAX_RETRIES - 1:
                logger.error("OpenAI API failed after %d retries: %s", _MAX_RETRIES, exc)
                raise
            delay = _RETRY_BASE_DELAY * (2 ** attempt)
            logger.warning("OpenAI error (attempt %d/%d), retrying in %.1fs: %s",
                           attempt + 1, _MAX_RETRIES, delay, exc)
            await asyncio.sleep(delay)

    # Should never reach here — loop above always returns or raises
    raise RuntimeError("process_turn: exhausted retries without result")
