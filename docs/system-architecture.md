# System Architecture — AI Lead Qualification Agent

## Overview

Next.js 15 app (Vercel serverless). Stateless at request level, stateful via Postgres. Workflow DevKit bridges durable execution across serverless invocations.

## Data Flow Per Message

```
Inbound (Web Form / Email)
  → Channel Normalizer (InboundMessage)
    → Conversation Engine (lib/services.ts)
      → Claude: generate reply
      → Claude: extract criteria (parallel generateObject)
      → Persist messages + criteria (Postgres)
      → [if 4 criteria met] → trigger Qualification Workflow (background)
        → scoreLead → buildBrief → notifyDashboard → proposeBooking
```

## Key Components

| Component | File | Purpose |
|-----------|------|---------|
| AI client | `lib/ai-client.ts` | Centralized provider config — `aiModel` export, swap in 1 line |
| Channel normalizer | `lib/channels.ts` | Web form + email → InboundMessage |
| Conversation engine | `lib/services.ts` | Single AI call per turn: `generateObject({reply, criteria, escalate})` |
| System prompt | `lib/prompts.ts` | Agent persona + guardrails + embedded rule list |
| Qualification workflow | `workflows/inbound/` | Durable: score → brief → notify → book |
| Data layer | `lib/db.ts` | Drizzle schema + typed query helpers |

## Lead State Machine

```
active → qualified → pending_approval → approved → booked
                                      → rejected
abandoned (48h no response)
```

## AI Call Pattern

```
Per conversation turn (1 API call):
  generateObject(turnSchema) → { reply, criteria, escalate }
  ↳ No separate extraction call — reply + state update + rule detection in one shot

Per qualification (1 API call, runs once when all 4 criteria met):
  generateObject(leadScoreSchema) → { totalScore, label, reasoning, suggestedNextAction }
```

## External Services (MVP Demo)

| Service | Use | Notes |
|---------|-----|-------|
| **OpenAI GPT-4o** | Conversation + scoring | via `@ai-sdk/openai`, structured outputs |
| Vercel Postgres | All data | leads, messages, rules, listings |
| Sendgrid | Email channel | Inbound Parse + Send API |
| Workflow DevKit | Durable workflow | Or sync fallback for demo |
| Google Calendar | Booking slots | Mocked for demo |
