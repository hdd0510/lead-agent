'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { RefreshCw, MessageCircle } from 'lucide-react'
import { getLeads, resetDemo } from '@/lib/api'
import type { Lead } from '@/lib/api'
import LeadCard from '@/components/lead-card'
import LeadDetail from '@/components/lead-detail'

// Sort leads: HOT → WARM → COLD → null, then by score desc
function sortLeads(leads: Lead[]): Lead[] {
  const labelOrder = { HOT: 0, WARM: 1, COLD: 2 }
  return [...leads].sort((a, b) => {
    const la = a.label ? labelOrder[a.label] : 3
    const lb = b.label ? labelOrder[b.label] : 3
    if (la !== lb) return la - lb
    return (b.score ?? 0) - (a.score ?? 0)
  })
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  const fetchLeads = useCallback(async () => {
    try {
      const data = await getLeads()
      setLeads(sortLeads(data))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
    const interval = setInterval(fetchLeads, 5000)
    return () => clearInterval(interval)
  }, [fetchLeads])

  async function handleReset() {
    if (!confirm('Reset all demo data?')) return
    setResetting(true)
    try {
      await resetDemo()
      setSelectedLeadId(null)
      await fetchLeads()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset demo')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left sidebar — lead list */}
      <aside className="w-80 shrink-0 flex flex-col border-r border-gray-200 bg-white">
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-sm">LeadAgent</span>
            </Link>
            <p className="text-xs text-gray-500">
              {leads.length} lead{leads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            title="Reset Demo"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Lead list */}
        <div className="flex-1 overflow-y-auto">
          {loading && leads.length === 0 && (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
              Loading leads...
            </div>
          )}
          {!loading && leads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm text-center px-4">
              <p>No leads yet.</p>
              <p className="mt-1">Go to the listing page to start a conversation.</p>
              <Link href="/" className="mt-3 text-blue-500 hover:underline text-xs">
                View listings
              </Link>
            </div>
          )}
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              selected={lead.id === selectedLeadId}
              onClick={() => setSelectedLeadId(lead.id)}
            />
          ))}
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Nav links */}
        <div className="px-4 py-3 border-t border-gray-200 flex gap-3">
          <Link href="/" className="text-xs text-gray-500 hover:text-blue-600">Home</Link>
          <Link href="/config" className="text-xs text-gray-500 hover:text-blue-600">Configure</Link>
        </div>
      </aside>

      {/* Right panel — lead detail */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedLeadId ? (
          <LeadDetail leadId={selectedLeadId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium">Select a lead to view details</p>
            <p className="text-xs mt-1 text-gray-300">
              {leads.length > 0
                ? `${leads.length} lead${leads.length !== 1 ? 's' : ''} in the sidebar`
                : 'No leads yet — start a conversation on the listing page'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
