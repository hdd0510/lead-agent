'use client'

import { clsx } from 'clsx'
import type { Lead } from '@/lib/api'
import StatusChip from './status-chip'

type Props = {
  lead: Lead
  selected: boolean
  onClick: () => void
}

const LABEL_STYLES: Record<string, string> = {
  HOT: 'bg-red-100 text-red-700 border border-red-200',
  WARM: 'bg-amber-100 text-amber-700 border border-amber-200',
  COLD: 'bg-blue-100 text-blue-700 border border-blue-200',
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function LeadCard({ lead, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors',
        selected && 'bg-blue-50 border-l-4 border-l-blue-500'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 truncate text-sm">
            {lead.name ?? 'Anonymous'}
          </p>
          <p className="text-xs text-gray-500 truncate">{lead.listing_id ?? 'No listing'}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {lead.label && (
            <span
              className={clsx(
                'text-xs font-bold px-1.5 py-0.5 rounded',
                LABEL_STYLES[lead.label]
              )}
            >
              {lead.label}
            </span>
          )}
          {lead.score != null && (
            <span className="text-xs text-gray-500">{lead.score}/100</span>
          )}
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <StatusChip
          status={lead.status}
          draftReply={lead.draft_reply}
          bookedSlot={lead.booked_slot}
        />
        <span className="text-xs text-gray-400">{timeAgo(lead.updated_at)}</span>
      </div>
    </button>
  )
}
