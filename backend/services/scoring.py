"""Score a qualified lead using GPT-4o structured output."""
import asyncio
import logging
from openai import AsyncOpenAI, APIError, RateLimitError
from pydantic import BaseModel

from config import get_llm_config
from db.models import Lead, Message

logger = logging.getLogger(__name__)


def _get_client() -> tuple[AsyncOpenAI, str]:
    cfg = get_llm_config()
    return AsyncOpenAI(api_key=cfg["api_key"], base_url=cfg["base_url"] or None), cfg["model"]

_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 1.0


class LeadScore(BaseModel):
    budget_score: int        # 0-30
    timeline_score: int      # 0-25
    purpose_score: int       # 0-25
    decision_maker_score: int  # 0-20
    total_score: int         # 0-100
    label: str               # HOT | WARM | COLD
    reasoning: str
    suggested_next_action: str
    conversation_summary: str


_SCORING_PROMPT = """Score this real estate lead. Scoring rules:
- Budget: ready funds=30, high range=20, medium range=10, unclear/low=0
- Timeline: <=1 month=25, <=3 months=18, <=6 months=10, >6 months=0
- Purpose: primary_residence=25, investment=20, unclear=0
- Decision maker: sole=20, not sole or unclear=0
HOT >= 80, WARM 50-79, COLD < 50.
Write a 2-sentence conversation_summary and a concrete suggested_next_action for the agent.
All score fields must be integers. total_score = sum of the four sub-scores."""


async def score_lead(lead: Lead, messages: list[Message]) -> LeadScore:
    """Call GPT-4o to score the lead. Retries up to 3 times with exponential backoff."""
    conversation = "\n".join(
        f"{m.role.upper()}: {m.content}" for m in messages
    )
    user_content = (
        f"Lead: {lead.name or 'Unknown'}, "
        f"Listing: {lead.listing_id or 'general inquiry'}\n\n"
        f"Conversation:\n{conversation}"
    )

    client, model = _get_client()
    for attempt in range(_MAX_RETRIES):
        try:
            response = await client.beta.chat.completions.parse(
                model=model,
                messages=[
                    {"role": "system", "content": _SCORING_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                response_format=LeadScore,
            )
            result = response.choices[0].message.parsed
            if result is None:
                raise ValueError("OpenAI returned null parsed output for scoring")
            return result

        except (RateLimitError, APIError) as exc:
            if attempt == _MAX_RETRIES - 1:
                logger.error("Scoring API failed after %d retries: %s", _MAX_RETRIES, exc)
                raise
            delay = _RETRY_BASE_DELAY * (2 ** attempt)
            logger.warning("Scoring retry %d/%d in %.1fs: %s", attempt + 1, _MAX_RETRIES, delay, exc)
            await asyncio.sleep(delay)

    raise RuntimeError("score_lead: exhausted retries")
