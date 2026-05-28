"""Pydantic v2 request/response schemas for all API endpoints."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str
    channel: str = "webform"  # 'webform' | 'email'
    lead_id: Optional[str] = None
    listing_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("channel")
    @classmethod
    def channel_must_be_valid(cls, v: str) -> str:
        if v not in ("webform", "email"):
            raise ValueError("channel must be 'webform' or 'email'")
        return v


class ChatResponse(BaseModel):
    lead_id: str
    reply: str
    escalated: bool


# ---------------------------------------------------------------------------
# Lead
# ---------------------------------------------------------------------------

class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    timestamp: datetime

    model_config = {"from_attributes": True}


class LeadSummary(BaseModel):
    id: str
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    channel: str
    listing_id: Optional[str]
    status: str
    score: Optional[int]
    label: Optional[str]
    criteria_collected: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LeadDetail(LeadSummary):
    score_reasoning: Optional[str]
    budget_range: Optional[str]
    timeline_months: Optional[int]
    purpose: Optional[str]
    is_decision_maker: Optional[bool]
    conversation_summary: Optional[str]
    suggested_next_action: Optional[str]
    draft_reply: Optional[str]
    triggered_rule_id: Optional[str]
    booked_slot: Optional[datetime]
    messages: list[MessageOut] = []

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Rules
# ---------------------------------------------------------------------------

class RuleCreate(BaseModel):
    description: str
    action: str  # 'escalate' | 'draft'
    enabled: bool = True

    @field_validator("action")
    @classmethod
    def action_must_be_valid(cls, v: str) -> str:
        if v not in ("escalate", "draft"):
            raise ValueError("action must be 'escalate' or 'draft'")
        return v


class RulePatch(BaseModel):
    description: Optional[str] = None
    action: Optional[str] = None
    enabled: Optional[bool] = None


class RuleOut(BaseModel):
    id: str
    description: str
    action: str
    enabled: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Actions (HITL)
# ---------------------------------------------------------------------------

class DraftRequest(BaseModel):
    content: str  # possibly edited draft text to send


class BookingRequest(BaseModel):
    slot_id: str


# ---------------------------------------------------------------------------
# Email webhook (Sendgrid Inbound Parse)
# ---------------------------------------------------------------------------

class EmailWebhookPayload(BaseModel):
    from_email: str
    subject: Optional[str] = None
    text: Optional[str] = None
    html: Optional[str] = None


# ---------------------------------------------------------------------------
# Demo
# ---------------------------------------------------------------------------

class DemoResetResponse(BaseModel):
    ok: bool
    message: str


class SeedStatusResponse(BaseModel):
    seeded: bool
    lead_count: int
    rule_count: int
    listing_count: int
