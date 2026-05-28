'use client'

import { useState } from 'react'
import { AlertTriangle, Send } from 'lucide-react'
import { sendDraft } from '@/lib/api'
import type { Lead } from '@/lib/api'

type Props = {
  lead: Lead
  onAction: () => void
}

export default function DraftPanel({ lead, onAction }: Props) {
  const [draft, setDraft] = useState(lead.draft_reply ?? '')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (!draft.trim()) return
    setSending(true)
    setError(null)
    try {
      await sendDraft(lead.id, draft)
      onAction()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send draft')
    } finally {
      setSending(false)
    }
  }

  async function handleDiscard() {
    onAction()
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 space-y-4">
      {/* Rule triggered banner */}
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-orange-800 text-sm">Rule triggered</p>
          <p className="text-sm text-orange-700 mt-0.5 italic">
            {lead.triggered_rule_id
              ? `Rule ID: ${lead.triggered_rule_id}`
              : 'Escalation rule matched'}
          </p>
        </div>
      </div>

      <div className="border-t border-orange-200" />

      {/* Draft reply editor */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-orange-800 uppercase tracking-wide">
          Draft Reply (editable)
        </label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          placeholder="Draft reply..."
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Sending...' : 'Send Draft'}
        </button>
        <button
          onClick={handleDiscard}
          className="px-4 py-2 bg-white border border-orange-200 text-orange-700 text-sm font-medium rounded-lg hover:bg-orange-50 transition-colors"
        >
          Discard
        </button>
      </div>
    </div>
  )
}
