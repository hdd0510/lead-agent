'use client'
import { useState } from 'react'
import { Lead, Message } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ConversationView } from '@/components/conversation-view'
import { CriteriaChecklist } from '@/components/criteria-checklist'
import { cn } from '@/lib/utils'
import { Check, X, Send, AlertTriangle, Calendar, MessageSquare } from 'lucide-react'

function labelVariant(label: string | null): 'hot' | 'warm' | 'cold' | 'secondary' {
  if (label === 'HOT') return 'hot'
  if (label === 'WARM') return 'warm'
  if (label === 'COLD') return 'cold'
  return 'secondary'
}

const LISTING_NAMES: Record<string, string> = {
  'le-marais-apt': 'Le Marais Apartment',
  'bastille-studio': 'Bastille Studio',
  'republique-family': 'République Family Home',
}

export function LeadDetail({
  lead,
  messages,
  onApprove,
  onReject,
  onSendDraft,
}: {
  lead: Lead
  messages: Message[]
  onApprove: () => Promise<void>
  onReject: () => Promise<void>
  onSendDraft: (msg: string) => Promise<void>
}) {
  const [draft, setDraft] = useState(lead.draft_reply ?? '')
  const [loading, setLoading] = useState(false)

  async function handle(fn: () => Promise<void>) {
    setLoading(true)
    try { await fn() } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base truncate">{lead.name ?? 'Unknown'}</h2>
            {lead.label && (
              <Badge variant={labelVariant(lead.label)}>
                {lead.label} {lead.score}/100
              </Badge>
            )}
            {lead.status === 'booked' && <Badge variant="booked">Booked ✓</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lead.listing_id ? (LISTING_NAMES[lead.listing_id] ?? lead.listing_id) : 'General inquiry'}
            {' · '}
            {lead.channel === 'email' ? '✉ Email' : '🌐 Web form'}
            {lead.email && ` · ${lead.email}`}
          </p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 space-y-5">
          {/* Booked confirmation */}
          {lead.status === 'booked' && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:bg-green-900/10 dark:border-green-800">
              <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400 mb-2">
                <Calendar className="size-4" />
                Viewing Booked Autonomously ✓
              </div>
              {lead.booked_slot && (
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  {new Date(lead.booked_slot).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
              {lead.conversation_summary && (
                <p className="text-sm text-green-800/80 dark:text-green-300/80 italic">
                  {lead.conversation_summary}
                </p>
              )}
            </div>
          )}

          {/* Summary (non-booked) */}
          {lead.conversation_summary && lead.status !== 'booked' && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Summary
              </h3>
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800 italic dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-300">
                {lead.conversation_summary}
              </div>
            </div>
          )}

          {/* Next action */}
          {lead.suggested_next_action && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Suggested Next Action
              </h3>
              <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:bg-amber-900/10 dark:text-amber-300">
                {lead.suggested_next_action}
              </div>
            </div>
          )}

          {/* Criteria */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Qualification
            </h3>
            <CriteriaChecklist lead={lead} />
          </div>

          <Separator />

          {/* Conversation */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1">
              <MessageSquare className="size-3" /> Conversation
            </h3>
            <ConversationView messages={messages} />
          </div>
        </div>
      </div>

      {/* Sticky action footer */}
      <div className="border-t px-6 py-4">
        {lead.status === 'pending_approval' && lead.triggered_rule_id && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4" />
              Rule triggered — draft reply ready for review
            </div>
            <Textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={3}
              className="text-sm resize-none"
              placeholder="Draft reply..."
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handle(() => onSendDraft(draft))}
                disabled={loading}
                className="flex-1"
              >
                <Send className="size-3" /> Send Draft
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handle(onReject)}
                disabled={loading}
              >
                <X className="size-3" /> Discard
              </Button>
            </div>
          </div>
        )}

        {lead.status === 'pending_approval' && !lead.triggered_rule_id && (
          <div className="flex gap-3">
            <Button onClick={() => handle(onApprove)} disabled={loading} className="flex-1">
              <Check className="size-4" /> Approve Booking
            </Button>
            <Button
              variant="outline"
              onClick={() => handle(onReject)}
              disabled={loading}
              className="flex-1"
            >
              <X className="size-4" /> Reject
            </Button>
          </div>
        )}

        {lead.status === 'active' && (
          <p className="text-sm text-muted-foreground text-center">
            Qualifying in progress — {lead.criteria_collected}/4 criteria collected
          </p>
        )}

        {lead.status === 'approved' && (
          <p className="text-sm text-green-600 dark:text-green-400 text-center font-medium">
            ✓ Appointment confirmed
          </p>
        )}

        {lead.status === 'rejected' && (
          <p className={cn('text-sm text-muted-foreground text-center')}>Lead closed</p>
        )}
      </div>
    </div>
  )
}
