import uuid
from datetime import datetime
from sqlalchemy import Text, ForeignKey, Boolean, Integer, DateTime
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped, relationship
from typing import Optional


class Base(DeclarativeBase):
    pass


def _uuid() -> str:
    return str(uuid.uuid4())


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    channel: Mapped[str]  # 'webform' | 'email'
    name: Mapped[Optional[str]]
    phone: Mapped[Optional[str]]
    email: Mapped[Optional[str]]
    listing_id: Mapped[Optional[str]]

    # Lifecycle status
    status: Mapped[str] = mapped_column(default="active")
    # active | qualified | pending_approval | approved | rejected | booked | abandoned

    # Scoring
    score: Mapped[Optional[int]]
    label: Mapped[Optional[str]]  # HOT | WARM | COLD
    score_reasoning: Mapped[Optional[str]] = mapped_column(Text)

    # Qualification criteria flags
    criteria_collected: Mapped[int] = mapped_column(default=0)
    criteria_budget: Mapped[bool] = mapped_column(Boolean, default=False)
    criteria_timeline: Mapped[bool] = mapped_column(Boolean, default=False)
    criteria_purpose: Mapped[bool] = mapped_column(Boolean, default=False)
    criteria_decision_maker: Mapped[bool] = mapped_column(Boolean, default=False)

    # Extracted criteria values
    budget_range: Mapped[Optional[str]]
    timeline_months: Mapped[Optional[int]]
    purpose: Mapped[Optional[str]]  # 'primary_residence' | 'investment' | 'unclear'
    is_decision_maker: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # AI-generated summaries
    conversation_summary: Mapped[Optional[str]] = mapped_column(Text)
    suggested_next_action: Mapped[Optional[str]] = mapped_column(Text)
    draft_reply: Mapped[Optional[str]] = mapped_column(Text)

    # Escalation
    triggered_rule_id: Mapped[Optional[str]]

    # Booking
    booked_slot: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="lead", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    lead_id: Mapped[str] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"))
    role: Mapped[str]  # 'user' | 'assistant'
    content: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lead: Mapped["Lead"] = relationship("Lead", back_populates="messages")


class Rule(Base):
    __tablename__ = "rules"

    id: Mapped[str] = mapped_column(primary_key=True, default=_uuid)
    description: Mapped[str] = mapped_column(Text)
    action: Mapped[str]  # 'escalate' | 'draft'
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[str] = mapped_column(primary_key=True)
    title: Mapped[str]
    price: Mapped[int]
    bedrooms: Mapped[Optional[int]]
    area: Mapped[Optional[str]]
    description: Mapped[Optional[str]] = mapped_column(Text)
    features: Mapped[Optional[str]]  # JSON string array
