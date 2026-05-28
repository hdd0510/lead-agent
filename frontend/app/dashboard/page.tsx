'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Lead, Message,
  getLeads, getLead, approveLead, rejectLead, sendDraft, resetDemo, seedDemo,
} from '@/lib/api'
import { LeadCard } from '@/components/lead-card'
import { LeadDetail } from '@/components/lead-detail'
import { Button } from '@/components/ui/button'
import { Bot, RefreshCw, RotateCcw, Users } from 'lucide-react'
import { toast } from 'sonner'

function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">{count}</span>
    </div>
  )
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<{ lead: Lead; messages: Message[] } | null>(null)
  const [resetting, setResetting] = useState(false)

  const fetchLeads = useCallback(async () => {
    try { setLeads(await getLeads()) } catch { /* silent */ }
  }, [])

  const fetchDetail = useCallback(async (id: string) => {
    try { setDetail(await getLead(id)) } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchLeads()
    const t = setInterval(fetchLeads, 5000)
    return () => clearInterval(t)
  }, [fetchLeads])

  useEffect(() => {
    if (!selectedId) return
    fetchDetail(selectedId)
    const t = setInterval(() => fetchDetail(selectedId), 5000)
    return () => clearInterval(t)
  }, [selectedId, fetchDetail])

  async function handleReset() {
    setResetting(true)
    try {
      await resetDemo()
      await seedDemo()
      await fetchLeads()
      setSelectedId(null)
      setDetail(null)
      toast.success('Demo reset — 3 scenarios restored')
    } catch { toast.error('Reset failed') }
    finally { setResetting(false) }
  }

  async function handleApprove() {
    if (!selectedId) return
    await approveLead(selectedId)
    await fetchDetail(selectedId)
    await fetchLeads()
    toast.success('Lead approved')
  }

  async function handleReject() {
    if (!selectedId) return
    await rejectLead(selectedId)
    await fetchDetail(selectedId)
    await fetchLeads()
    toast.success('Lead rejected')
  }

  async function handleSendDraft(message: string) {
    if (!selectedId) return
    await sendDraft(selectedId, message)
    await fetchDetail(selectedId)
    await fetchLeads()
    toast.success('Draft sent')
  }

  const hot = leads.filter(l => l.label === 'HOT').sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const warm = leads.filter(l => l.label === 'WARM').sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const cold = leads.filter(l => l.label === 'COLD').sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const active = leads.filter(l => !l.label)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-72 flex-none border-r flex flex-col bg-sidebar">
        <div className="px-4 py-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="size-5 text-muted-foreground" />
            <span className="font-semibold text-sm">Lead Agent</span>
            <a href="/" className="ml-auto text-xs text-muted-foreground hover:text-foreground">
              ← Site
            </a>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-7"
              onClick={fetchLeads}
            >
              <RefreshCw className="size-3" /> Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-7"
              onClick={handleReset}
              disabled={resetting}
            >
              <RotateCcw className="size-3" /> {resetting ? 'Resetting...' : 'Reset Demo'}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
              <Users className="size-8 opacity-30" />
              <p>No leads yet</p>
              <Button size="sm" variant="ghost" className="text-xs" onClick={handleReset}>
                Seed demo data
              </Button>
            </div>
          ) : (
            <>
              {hot.length > 0 && <GroupHeader label="🔴 Hot" count={hot.length} />}
              {hot.map(l => (
                <LeadCard key={l.id} lead={l} selected={selectedId === l.id} onClick={() => setSelectedId(l.id)} />
              ))}
              {warm.length > 0 && <GroupHeader label="🟡 Warm" count={warm.length} />}
              {warm.map(l => (
                <LeadCard key={l.id} lead={l} selected={selectedId === l.id} onClick={() => setSelectedId(l.id)} />
              ))}
              {cold.length > 0 && <GroupHeader label="🔵 Cold" count={cold.length} />}
              {cold.map(l => (
                <LeadCard key={l.id} lead={l} selected={selectedId === l.id} onClick={() => setSelectedId(l.id)} />
              ))}
              {active.length > 0 && <GroupHeader label="⏳ Qualifying" count={active.length} />}
              {active.map(l => (
                <LeadCard key={l.id} lead={l} selected={selectedId === l.id} onClick={() => setSelectedId(l.id)} />
              ))}
            </>
          )}
        </div>

        <div className="border-t p-3 flex gap-2">
          <a href="/config" className="flex-1">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              Configure Rules
            </Button>
          </a>
        </div>
      </aside>

      {/* Detail panel */}
      <main className="flex-1 overflow-hidden">
        {!selectedId || !detail ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <Bot className="size-12 opacity-20" />
            <p className="text-sm">Select a lead to view details</p>
          </div>
        ) : (
          <LeadDetail
            lead={detail.lead}
            messages={detail.messages}
            onApprove={handleApprove}
            onReject={handleReject}
            onSendDraft={handleSendDraft}
          />
        )}
      </main>
    </div>
  )
}
