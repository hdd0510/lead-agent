import { Lead } from '@/lib/api'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type CriteriaItem = {
  key: keyof Lead
  label: string
  getValue: (l: Lead) => string | null
}

const CRITERIA: CriteriaItem[] = [
  {
    key: 'criteria_budget',
    label: 'Budget',
    getValue: (l) => l.budget_range,
  },
  {
    key: 'criteria_timeline',
    label: 'Timeline',
    getValue: (l) => (l.timeline_months !== null ? `${l.timeline_months} month${l.timeline_months !== 1 ? 's' : ''}` : null),
  },
  {
    key: 'criteria_purpose',
    label: 'Purpose',
    getValue: (l) => (l.purpose ? l.purpose.replace('_', ' ') : null),
  },
  {
    key: 'criteria_decision_maker',
    label: 'Decision maker',
    getValue: (l) => (l.is_decision_maker !== null ? (l.is_decision_maker ? 'Sole DM' : 'Not sole DM') : null),
  },
]

export function CriteriaChecklist({ lead }: { lead: Lead }) {
  return (
    <div className="rounded-lg border divide-y overflow-hidden">
      {CRITERIA.map(c => {
        const answered = lead[c.key] as boolean
        const value = c.getValue(lead)
        return (
          <div
            key={c.key as string}
            className={cn('flex items-center gap-3 px-4 py-2.5 text-sm', answered ? 'bg-background' : 'bg-muted/30')}
          >
            <div
              className={cn(
                'size-5 rounded-full flex items-center justify-center shrink-0',
                answered
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {answered ? <Check className="size-3" /> : <X className="size-3" />}
            </div>
            <span className={cn('font-medium', !answered && 'text-muted-foreground')}>{c.label}</span>
            {value && <span className="ml-auto text-muted-foreground text-xs capitalize">{value}</span>}
          </div>
        )
      })}
    </div>
  )
}
