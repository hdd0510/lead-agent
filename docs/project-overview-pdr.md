# Project Overview — AI Lead Qualification Agent

**Product:** AI assistant that qualifies inbound real estate leads end-to-end — from first reply to booked viewing — with human agents stepping in only when it matters.

**Current phase:** MVP Demo (Scope V0) — showable, not shippable. 1-week build.

**Target users:** Independent real estate agencies (1–10 agents)

## The Problem

Agencies lose leads daily: slow response (>5 min = 80% drop in conversion) + no triage system. Agents spend hours on tire-kickers and miss hot leads.

## The Solution

AI handles inbound automatically: replies in seconds, qualifies via natural conversation (4 criteria), scores HOT/WARM/COLD, books viewings, hands off when rules trigger.

## Three Demo Magic Moments

1. AI books viewing autonomously → agent sees clean summary + next-action
2. Plain-language rule triggers handoff → draft reply waiting in dashboard  
3. Config screen: add rule + toggle draft mode → immediate effect

## Stack

Next.js 15 + TypeScript · **GPT-4o** (`@ai-sdk/openai`) · Vercel Postgres · Drizzle ORM · Workflow DevKit · Sendgrid
