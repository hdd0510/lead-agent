'use client'

import { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { getLead, approveLead, rejectLead } from '@/lib/api'
import type { Lead, Message } from '@/lib/api'
import StatusChip from './status-chip'
import CriteriaChecklist from './criteria-checklist'
import ConversationView from './conversation-view'
import DraftPanel from './draft-panel'
import BookingConfirmation from './booking-confirmation'

type Props = {
  leadId: string
}

const LABEL_STYLES: Record<string, string> = {
  HOT: 'bg-red-100 text-red-700 border border-red-200',
  WARM: 'bg-amber-100 text-amber-700 border border-amber-200',
  COLD: 'bg-blue-100 text-blue-700 border border-blue-200',
}

const CHANNEL_STYLES: Record<string, string> = {
  web: 'bg-indigo-100 text-indigo-700',
  whatsapp: 'bg-green-100 text-green-700',
  email: 'bg-purple-100 text-purple-700',
}

export default function LeadDetail({ leadId }: Props) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioning, setActioning] = useState(false)

  const fetchLead = useCallback(async () => {
    try {
      const data = await getLead(leadId)
      setLead(data.lead)
      setMessages(data.messages)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lead')
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    setLoading(true)
    fetchLead()
    const interval = setInterval(fetchLead, 5000)
    return () => clearInterval(interval)
  }, [fetchLead])

  async function handleApprove() {
    if (!lead) return
    setActioning(true)
    try { await approveLead(lead.id); await fetchLead() }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to approve') }
    finally { setActioning(false) }
  }

  async function handleReject() {
    if (!lead) return
    setActioning(true)
    try { await rejectLead(lead.id); await fetchLead() }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to reject') }
    finally { setActioning(false) }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Loading lead...</p>
        </div>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500 text-sm p-8 text-center">
        {error ?? 'Lead not found'}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {lead.name ?? 'Anonymous Lead'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {lead.listing_id && (
                <span className="text-sm text-gray-500">{lead.listing_id}</span>
              )}
              <span
                className={clsx(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  CHANNEL_STYLES[lead.channel] ?? 'bg-gray-100 text-gray-600'
                )}
              >
                {lead.channel}
              </span>
              <StatusChip status={lead.status} draftReply={lead.draft_reply} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {lead.label && (
              <span className={clsx('text-sm font-bold px-2 py-1 rounded', LABEL_STYLES[lead.label])}>
                {lead.label}
              </span>
            )}
            {lead.score != null && (
              <span className="text-sm text-gray-500">{lead.score}/100</span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Summary */}
        {lead.conversation_summary && (
          <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded italic text-sm">
            {lead.conversation_summary}
          </div>
        )}

        {/* Next action */}
        {lead.suggested_next_action && lead.status !== 'booked' && (
          <div className="border-l-4 border-amber-400 bg-amber-50 px-4 py-3 rounded-r">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
              Suggested Next Action
            </p>
            <p className="text-sm font-medium text-amber-900">{lead.suggested_next_action}</p>
          </div>
        )}

        {/* Criteria checklist */}
        <CriteriaChecklist lead={lead} />

        {/* Conversation */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Conversation ({messages.length} messages)
          </h3>
          <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 min-h-[200px]">
            <ConversationView messages={messages} className="max-h-80" />
          </div>
        </div>

        {/* Action area */}
        <ActionArea
          lead={lead}
          onApprove={handleApprove}
          onReject={handleReject}
          onDraftAction={fetchLead}
          actioning={actioning}
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
        )}
      </div>
    </div>
  )
}

// ── Action Area ────────────────────────────────────────────────────────────

type ActionAreaProps = {
  lead: Lead
  onApprove: () => void
  onReject: () => void
  onDraftAction: () => void
  actioning: boolean
}

function ActionArea({ lead, onApprove, onReject, onDraftAction, actioning }: ActionAreaProps) {
  // Booked — Magic Moment 1
  if (lead.status === 'booked') {
    return <BookingConfirmation lead={lead} />
  }

  // Pending approval with rule triggered — Magic Moment 2 (draft panel)
  if (lead.status === 'pending_approval' && lead.triggered_rule_id) {
    return <DraftPanel lead={lead} onAction={onDraftAction} />
  }

  // Pending approval without rule — manual approve/reject
  if (lead.status === 'pending_approval') {
    return (
      <div className="flex gap-3">
        <button
          onClick={onApprove}
          disabled={actioning}
          className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
        >
          Approve Booking
        </button>
        <button
          onClick={onReject}
          disabled={actioning}
          className="flex-1 py-2.5 bg-white border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors text-sm"
        >
          Reject
        </button>
      </div>
    )
  }

  if (lead.status === 'approved') {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 font-medium">
        Appointment link sent
      </div>
    )
  }

  if (lead.status === 'rejected') {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600">
        Lead closed
      </div>
    )
  }

  // Active — show progress
  if (lead.status === 'active') {
    const pct = Math.round((lead.criteria_collected / 4) * 100)
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Qualifying in progress...</span>
          <span>{lead.criteria_collected}/4 criteria</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    )
  }

  return null
}
