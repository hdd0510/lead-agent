"""Static scenario data: leads + message threads for the 3 demo personas."""
from datetime import datetime

# ---------------------------------------------------------------------------
# Scenario A: Jean-Pierre Martin — HOT 87, booked Thu 2pm
# ---------------------------------------------------------------------------

SCENARIO_A_LEAD = {
    "id": "demo-lead-a",
    "name": "Jean-Pierre Martin",
    "email": "jp.martin@demo.com",
    "channel": "webform",
    "listing_id": "le-marais-apt",
    "status": "booked",
    "score": 87,
    "label": "HOT",
    "criteria_budget": True,
    "criteria_timeline": True,
    "criteria_purpose": True,
    "criteria_decision_maker": True,
    "criteria_collected": 4,
    "budget_range": "200-400k",
    "timeline_months": 2,
    "purpose": "primary_residence",
    "is_decision_maker": True,
    "conversation_summary": (
        "Jean-Pierre is a serious buyer with €350k ready funds, "
        "looking to purchase within 2 months as a primary residence. "
        "He is the sole decision maker."
    ),
    "suggested_next_action": (
        "Confirm Thursday 2pm viewing. Mention the parking spot included — he asked about it."
    ),
    "booked_slot": datetime(2026, 6, 5, 14, 0, 0),
}

SCENARIO_A_MESSAGES: list[tuple[str, str]] = [
    ("user", "Hi, I'm interested in the Le Marais apartment I saw on your site."),
    ("assistant", "Hello Jean-Pierre! Great to hear from you. Le Marais is a beautiful 65m² apartment in Paris 3e — renovated kitchen, south-facing balcony, and parking included. What draws you to this property?"),
    ("user", "I'm looking for something to live in, ideally in the next couple of months. My budget is around 350k."),
    ("assistant", "That budget fits well for Le Marais at €350,000. Do you have funds available, or would you be going through mortgage financing?"),
    ("user", "I have the funds ready, no mortgage needed."),
    ("assistant", "Perfect — that makes things straightforward. Are you the one making the final decision, or will others be involved?"),
    ("user", "Just me. My wife and I discussed it and she's leaving it to me."),
    ("assistant", "Understood. Based on our conversation, I'd love to arrange a viewing.\n\n• Thursday, Jun 5 · 2:00 PM\n• Friday, Jun 6 · 10:00 AM\n• Saturday, Jun 7 · 11:00 AM\n\nWhich works best?"),
    ("user", "Thursday at 2pm works great."),
    ("assistant", "Perfect! Your viewing at Le Marais Apartment is confirmed for Thursday, Jun 5 · 2:00 PM. Looking forward to seeing you!"),
]

# ---------------------------------------------------------------------------
# Scenario B: Marie Dubois — WARM 62, escalated, draft waiting
# ---------------------------------------------------------------------------

SCENARIO_B_LEAD = {
    "id": "demo-lead-b",
    "name": "Marie Dubois",
    "email": "marie.dubois@demo.com",
    "channel": "email",
    "listing_id": "bastille-studio",
    "status": "pending_approval",
    "score": 62,
    "label": "WARM",
    "criteria_budget": True,
    "criteria_timeline": True,
    "criteria_purpose": True,
    "criteria_decision_maker": False,
    "criteria_collected": 3,
    "budget_range": "150-200k",
    "timeline_months": 4,
    "purpose": "investment",
    "conversation_summary": (
        "Marie is interested in the Bastille Studio as an investment. "
        "Budget fits, timeline 4 months. Asked about price negotiation — triggered escalation."
    ),
    "draft_reply": (
        "Hi Marie, thank you for your interest in the Bastille Studio. "
        "I understand you'd like to discuss the pricing. "
        "I'd be happy to have a quick call to go over the details — when would be a good time for you?"
    ),
}

SCENARIO_B_MESSAGES: list[tuple[str, str]] = [
    ("user", "Hello, I saw the Bastille Studio listing. I'm looking for an investment property."),
    ("assistant", "Hi Marie! The Bastille Studio is a great investment option — 28m² in Paris 11e, 5 min from Bastille metro. What's your target budget?"),
    ("user", "Around 180k, the asking price. Though I was wondering if there's any flexibility?"),
    ("assistant", "Thank you — I'm connecting you with a specialist who can help with that."),
]

# ---------------------------------------------------------------------------
# Scenario C: Thomas Bernard — Active, 2 criteria collected (for live demo)
# ---------------------------------------------------------------------------

SCENARIO_C_LEAD = {
    "id": "demo-lead-c",
    "name": "Thomas Bernard",
    "email": "thomas.b@demo.com",
    "channel": "webform",
    "listing_id": "republique-family",
    "status": "active",
    "criteria_budget": True,
    "criteria_timeline": True,
    "criteria_purpose": False,
    "criteria_decision_maker": False,
    "criteria_collected": 2,
    "budget_range": ">650k",
    "timeline_months": 1,
}

SCENARIO_C_MESSAGES: list[tuple[str, str]] = [
    ("user", "Hi, I'm very interested in the République family home."),
    ("assistant", "Hello Thomas! The République property is stunning — 140m² townhouse with private garden in Paris 10e. What's your budget range?"),
    ("user", "We can go up to 700k if needed."),
    ("assistant", "That works perfectly for this property. How soon are you looking to move?"),
    ("user", "Within the next month ideally, we're quite urgent."),
    ("assistant", "A one-month timeline — great. Is this property for your family to live in, or more of an investment?"),
]
