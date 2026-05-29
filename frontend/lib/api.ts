// API client for AI Lead Qualification Agent backend
// Uses /proxy/* which Next.js rewrites server-side → works regardless of how the user accesses the app
const API_URL = '/proxy'

// ── Types ──────────────────────────────────────────────────────────────────

export type Lead = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  channel: string
  listing_id: string | null
  status: 'active' | 'qualified' | 'pending_approval' | 'approved' | 'rejected' | 'booked' | 'abandoned'
  score: number | null
  label: 'HOT' | 'WARM' | 'COLD' | null
  criteria_collected: number
  criteria_budget: boolean
  criteria_timeline: boolean
  criteria_purpose: boolean
  criteria_decision_maker: boolean
  budget_range: string | null
  timeline_months: number | null
  purpose: string | null
  is_decision_maker: boolean | null
  conversation_summary: string | null
  suggested_next_action: string | null
  draft_reply: string | null
  triggered_rule_id: string | null
  booked_slot: string | null
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export type Rule = {
  id: string
  description: string
  action: 'escalate' | 'draft'
  enabled: boolean
  created_at: string
}

export type BookingSlot = {
  id: string
  label: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${path} failed (${res.status}): ${text}`)
  }
  // 204 No Content
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Chat ───────────────────────────────────────────────────────────────────

export async function sendMessage(data: {
  message: string
  channel: string
  listing_id?: string
  email?: string
  phone?: string
  name?: string
  lead_id?: string
}): Promise<{ lead_id: string; reply: string; escalated: boolean }> {
  return apiFetch('/chat', { method: 'POST', body: JSON.stringify(data) })
}

export async function getChatHistory(leadId: string): Promise<{ messages: Message[] }> {
  const data = await apiFetch<{ lead: Lead; messages: Message[] }>(`/leads/${leadId}`)
  return { messages: data.messages }
}

// ── Leads ──────────────────────────────────────────────────────────────────

export async function getLeads(): Promise<Lead[]> {
  return apiFetch('/leads')
}

export async function getLead(leadId: string): Promise<{ lead: Lead; messages: Message[] }> {
  // Backend returns a flat LeadDetail object with messages inside, not { lead, messages }
  const data = await apiFetch<Lead & { messages: Message[] }>(`/leads/${leadId}`)
  const { messages, ...lead } = data
  return { lead: lead as Lead, messages }
}

export async function approveLead(leadId: string): Promise<void> {
  return apiFetch(`/leads/${leadId}/approve`, { method: 'POST' })
}

export async function rejectLead(leadId: string): Promise<void> {
  return apiFetch(`/leads/${leadId}/reject`, { method: 'POST' })
}

export async function sendDraft(leadId: string, message: string): Promise<void> {
  return apiFetch(`/leads/${leadId}/draft`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

// ── Booking ────────────────────────────────────────────────────────────────

export async function getSlots(): Promise<BookingSlot[]> {
  return apiFetch('/slots')
}

export async function bookSlot(leadId: string, slotId: string): Promise<void> {
  return apiFetch(`/leads/${leadId}/book`, {
    method: 'POST',
    body: JSON.stringify({ slot_id: slotId }),
  })
}

// ── Rules ──────────────────────────────────────────────────────────────────

export async function getRules(): Promise<Rule[]> {
  return apiFetch('/rules')
}

export async function createRule(
  description: string,
  action: 'escalate' | 'draft'
): Promise<Rule> {
  return apiFetch('/rules', {
    method: 'POST',
    body: JSON.stringify({ description, action }),
  })
}

export async function updateRule(id: string, data: Partial<Rule>): Promise<Rule> {
  return apiFetch(`/rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteRule(id: string): Promise<void> {
  return apiFetch(`/rules/${id}`, { method: 'DELETE' })
}

// ── LLM Config ────────────────────────────────────────────────────────────

export type LlmProvider = 'openai' | 'gemini' | 'custom'

export type LlmConfig = {
  provider: LlmProvider
  api_key: string
  model: string
  base_url: string
}

export type LlmProviderInfo = {
  id: string
  base_url: string
  default_model: string
}

export async function getLlmConfig(): Promise<LlmConfig> {
  return apiFetch('/config/llm')
}

export async function updateLlmConfig(config: LlmConfig): Promise<LlmConfig> {
  return apiFetch('/config/llm', { method: 'PUT', body: JSON.stringify(config) })
}

export async function getLlmProviders(): Promise<LlmProviderInfo[]> {
  return apiFetch('/config/llm/providers')
}

// ── Demo ───────────────────────────────────────────────────────────────────

export async function resetDemo(): Promise<void> {
  return apiFetch('/demo/reset', { method: 'POST' })
}

export async function seedDemo(): Promise<void> {
  return apiFetch('/demo/seed', { method: 'POST' })
}
