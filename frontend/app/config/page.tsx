'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Sprout } from 'lucide-react'
import { getRules, resetDemo, seedDemo } from '@/lib/api'
import type { Rule } from '@/lib/api'
import RuleRow from '@/components/rule-row'
import AddRuleForm from '@/components/add-rule-form'

// ── Autonomy settings (localStorage — demo only) ──────────────────────────

const AUTONOMY_SETTINGS_KEY = 'lead_agent_autonomy'

type AutonomySetting = {
  id: string
  label: string
  defaultMode: string
  enabled: boolean
}

const DEFAULT_AUTONOMY: AutonomySetting[] = [
  { id: 'standard', label: 'Standard inquiries', defaultMode: 'Auto-reply', enabled: true },
  { id: 'investment', label: 'Investment leads', defaultMode: 'Draft-only', enabled: false },
  { id: 'high_value', label: 'High-value (>€500k)', defaultMode: 'Auto-reply', enabled: true },
]

function loadAutonomy(): AutonomySetting[] {
  if (typeof window === 'undefined') return DEFAULT_AUTONOMY
  try {
    const stored = localStorage.getItem(AUTONOMY_SETTINGS_KEY)
    return stored ? JSON.parse(stored) : DEFAULT_AUTONOMY
  } catch {
    return DEFAULT_AUTONOMY
  }
}

function saveAutonomy(settings: AutonomySetting[]) {
  try {
    localStorage.setItem(AUTONOMY_SETTINGS_KEY, JSON.stringify(settings))
  } catch { /* ignore */ }
}

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50">
      {message}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ConfigPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autonomy, setAutonomy] = useState<AutonomySetting[]>(DEFAULT_AUTONOMY)
  const [toast, setToast] = useState<string | null>(null)
  const [demoActioning, setDemoActioning] = useState(false)

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  // Load autonomy from localStorage after mount
  useEffect(() => {
    setAutonomy(loadAutonomy())
  }, [])

  const fetchRules = useCallback(async () => {
    try {
      const data = await getRules()
      setRules(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rules')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRules()
    const interval = setInterval(fetchRules, 10000)
    return () => clearInterval(interval)
  }, [fetchRules])

  function handleRuleUpdate(updated: Rule) {
    setRules(prev => prev.map(r => (r.id === updated.id ? updated : r)))
  }

  function handleRuleDelete(id: string) {
    setRules(prev => prev.filter(r => r.id !== id))
  }

  function handleRuleAdded(rule: Rule) {
    setRules(prev => [rule, ...prev])
  }

  function toggleAutonomy(id: string) {
    setAutonomy(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
      saveAutonomy(next)
      return next
    })
  }

  async function handleReset() {
    if (!confirm('Reset all demo data?')) return
    setDemoActioning(true)
    try {
      await resetDemo()
      setToast('Demo reset successfully')
      await fetchRules()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset')
    } finally {
      setDemoActioning(false)
    }
  }

  async function handleSeed() {
    setDemoActioning(true)
    try {
      await seedDemo()
      setToast('Demo data seeded')
      await fetchRules()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to seed')
    } finally {
      setDemoActioning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Configuration</h1>
          <p className="text-sm text-gray-500">Manage AI rules and autonomy settings</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
        {/* Section 1: Escalation Rules */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Escalation &amp; Handoff Rules</h2>
          <p className="text-sm text-gray-500 mb-5">
            Write rules in plain language. The AI matches conversations against these automatically.
          </p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading && rules.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
                Loading rules...
              </div>
            ) : rules.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
                No rules yet — add one below.
              </div>
            ) : (
              <div>
                {rules.map(rule => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    onUpdate={handleRuleUpdate}
                    onDelete={handleRuleDelete}
                  />
                ))}
              </div>
            )}

            <div className="px-4 pb-4 pt-2">
              <AddRuleForm onAdded={handleRuleAdded} />
            </div>
          </div>
        </section>

        {/* Section 2: AI Autonomy Level */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-1">AI Autonomy Level</h2>
          <p className="text-sm text-gray-500 mb-5">
            Control how the AI handles different types of leads. Settings are saved locally.
          </p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mode</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Enabled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {autonomy.map(setting => (
                  <tr key={setting.id}>
                    <td className="px-4 py-3 text-gray-800 font-medium">{setting.label}</td>
                    <td className="px-4 py-3 text-gray-500">{setting.defaultMode}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleAutonomy(setting.id)}
                        className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${
                          setting.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            setting.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Demo Controls */}
        {isDemoMode && (
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Demo Controls</h2>
            <p className="text-sm text-gray-500 mb-5">
              Manage demo state for presentations.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={demoActioning}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${demoActioning ? 'animate-spin' : ''}`} />
                Reset Demo
              </button>
              <button
                onClick={handleSeed}
                disabled={demoActioning}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Sprout className="w-4 h-4" />
                Seed Demo Data
              </button>
            </div>
          </section>
        )}
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
