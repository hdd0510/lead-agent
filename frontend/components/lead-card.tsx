import { Lead } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Clock, Mail, Globe } from 'lucide-react'

function labelVariant(label: string | null): 'hot' | 'warm' | 'cold' | 'secondary' {
  if (label === 'HOT') return 'hot'
  if (label === 'WARM') return 'warm'
  if (label === 'COLD') return 'cold'
  return 'secondary'
}

function statusLabel(status: string, triggeredRuleId: string | null): string {
  if (status === 'booked') return 'Booked ✓'
  if (status === 'pending_approval' && triggeredRuleId) return 'Draft Ready'
  if (status === 'pending_approval') return 'Awaiting Review'
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  if (status === 'active') return 'Qualifying...'
  return status
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const LISTING_NAMES: Record<string, string> = {
  'le-marais-apt': 'Le Marais Apt',
  'bastille-studio': 'Bastille Studio',
  'republique-family': 'République Home',
}

export function LeadCard({
  lead,
  selected,
  onClick,
}: {
  lead: Lead
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3.5 border-b transition-colors hover:bg-accent/60',
        selected ? 'bg-accent border-l-2 border-l-primary' : 'bg-background'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{lead.name ?? 'Unknown'}</div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {lead.listing_id ? (LISTING_NAMES[lead.listing_id] ?? lead.listing_id) : 'General inquiry'}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {lead.label && (
            <Badge variant={labelVariant(lead.label)} className="text-[10px] px-1.5 py-0">
              {lead.label}
            </Badge>
          )}
          {lead.score !== null && (
            <span className="text-[10px] text-muted-foreground">{lead.score}/100</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div
          className={cn(
            'text-[11px] font-medium',
            lead.status === 'booked' && 'text-green-600',
            lead.status === 'pending_approval' && lead.triggered_rule_id && 'text-amber-600',
            lead.status === 'rejected' && 'text-muted-foreground'
          )}
        >
          {statusLabel(lead.status, lead.triggered_rule_id)}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {lead.channel === 'email' ? <Mail className="size-2.5" /> : <Globe className="size-2.5" />}
          <Clock className="size-2.5" />
          {timeAgo(lead.updated_at)}
        </div>
      </div>

      {lead.status === 'active' && (
        <div className="mt-2">
          <div className="flex gap-0.5">
            {[
              lead.criteria_budget,
              lead.criteria_timeline,
              lead.criteria_purpose,
              lead.criteria_decision_maker,
            ].map((v, i) => (
              <div key={i} className={cn('h-1 flex-1 rounded-full', v ? 'bg-primary' : 'bg-border')} />
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">{lead.criteria_collected}/4 criteria</div>
        </div>
      )}
    </button>
  )
}
