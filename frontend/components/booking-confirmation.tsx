'use client'

import { CheckCircle } from 'lucide-react'
import type { Lead } from '@/lib/api'

type Props = {
  lead: Lead
}

export default function BookingConfirmation({ lead }: Props) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
        <div>
          <h3 className="font-semibold text-green-800">Viewing Booked Autonomously</h3>
          {lead.booked_slot && (
            <p className="text-sm text-green-700 mt-0.5">{lead.booked_slot}</p>
          )}
        </div>
      </div>

      {lead.conversation_summary && (
        <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded italic text-sm">
          {lead.conversation_summary}
        </div>
      )}

      {lead.suggested_next_action && (
        <div className="border-l-4 border-amber-400 bg-amber-50 px-4 py-3 rounded-r">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
            Next Action
          </p>
          <p className="text-sm font-medium text-amber-900">{lead.suggested_next_action}</p>
        </div>
      )}
    </div>
  )
}
