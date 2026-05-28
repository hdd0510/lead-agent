'use client'

import { clsx } from 'clsx'
import type { Lead } from '@/lib/api'

type Props = {
  status: Lead['status']
  bookedSlot?: string | null
  draftReply?: string | null
  className?: string
}

const STATUS_CONFIG: Record<Lead['status'], { label: string; cls: string }> = {
  booked: { label: 'Viewing Booked ✓', cls: 'bg-green-100 text-green-700' },
  pending_approval: { label: 'Pending Approval', cls: 'bg-orange-100 text-orange-700' },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
  qualified: { label: 'Qualified', cls: 'bg-purple-100 text-purple-700' },
  active: { label: 'Qualifying...', cls: 'bg-gray-100 text-gray-600' },
  abandoned: { label: 'Abandoned', cls: 'bg-gray-100 text-gray-500' },
}

export default function StatusChip({ status, draftReply, className }: Props) {
  // Override label when draft is ready
  const config = STATUS_CONFIG[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  const label =
    status === 'pending_approval' && draftReply ? 'Draft Ready' : config.label

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.cls,
        className
      )}
    >
      {label}
    </span>
  )
}
