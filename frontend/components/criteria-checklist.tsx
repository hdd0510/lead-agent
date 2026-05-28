'use client'

import { Check, X } from 'lucide-react'
import type { Lead } from '@/lib/api'

type Props = {
  lead: Lead
}

type CriteriaRow = {
  label: string
  collected: boolean
  value: string | null
  fallback: string
}

export default function CriteriaChecklist({ lead }: Props) {
  const rows: CriteriaRow[] = [
    {
      label: 'Budget',
      collected: lead.criteria_budget,
      value: lead.budget_range,
      fallback: 'Not yet collected',
    },
    {
      label: 'Timeline',
      collected: lead.criteria_timeline,
      value: lead.timeline_months != null ? `${lead.timeline_months} months` : null,
      fallback: 'Not yet collected',
    },
    {
      label: 'Purpose',
      collected: lead.criteria_purpose,
      value: lead.purpose,
      fallback: 'Not yet collected',
    },
    {
      label: 'Decision Maker',
      collected: lead.criteria_decision_maker,
      value:
        lead.is_decision_maker === true
          ? 'Sole DM'
          : lead.is_decision_maker === false
          ? 'Not sole DM'
          : null,
      fallback: 'Not yet collected',
    },
  ]

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Qualification Criteria ({lead.criteria_collected}/4)
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                row.collected ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              {row.collected ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <X className="w-3 h-3 text-gray-400" />
              )}
            </span>
            <span className="text-sm font-medium text-gray-700 w-28 shrink-0">{row.label}</span>
            <span
              className={`text-sm ${
                row.collected ? 'text-gray-800' : 'text-gray-400 italic'
              }`}
            >
              {row.collected ? (row.value ?? row.fallback) : row.fallback}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
