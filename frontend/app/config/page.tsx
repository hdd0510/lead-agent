'use client'
import { useState, useEffect, useCallback } from 'react'
import { Rule, getRules, createRule, updateRule, deleteRule, resetDemo, seedDemo, LlmConfig, LlmProviderInfo, getLlmConfig, updateLlmConfig, getLlmProviders } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Bot, Plus, Trash2, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

// ── Autonomy row — owns its own toggle state to avoid useState-in-map ────────

type AutonomyRowProps = {
  label: string
  desc: string
  defaultOn: boolean
}

function AutonomyRow({ label, desc, defaultOn }: AutonomyRowProps) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{on ? 'Auto-reply' : 'Draft only'}</span>
        <Switch checked={on} onCheckedChange={setOn} />
      </div>
    </div>
  )
}

const AUTONOMY_ROWS: AutonomyRowProps[] = [
  { label: 'Standard inquiries', desc: 'Primary residence leads', defaultOn: true },
  { label: 'Investment leads', desc: 'Investment / rental property', defaultOn: false },
  { label: 'High-value leads (>€500k)', desc: 'Premium properties', defaultOn: true },
]

// ── LLM Provider section ─────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  custom: 'Custom',
}

function LlmProviderSection() {
  const [cfg, setCfg] = useState<LlmConfig>({ provider: 'openai', api_key: '', model: '', base_url: '' })
  const [providers, setProviders] = useState<LlmProviderInfo[]>([])
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    getLlmConfig().then(setCfg).catch(() => {})
    getLlmProviders().then(setProviders).catch(() => {})
  }, [])

  function handleProviderChange(id: string) {
    const info = providers.find(p => p.id === id)
    setCfg(prev => ({
      ...prev,
      provider: id as LlmConfig['provider'],
      base_url: id === 'custom' ? prev.base_url : (info?.base_url ?? ''),
      model: info?.default_model || prev.model,
    }))
    setDirty(true)
  }

  function update(field: keyof LlmConfig, value: string) {
    setCfg(prev => ({ ...prev, [field]: value }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateLlmConfig(cfg)
      toast.success('LLM config saved')
      setDirty(false)
    } catch { toast.error('Failed to save LLM config') }
    finally { setSaving(false) }
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-semibold text-lg">LLM Provider</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the AI model provider for conversation processing.
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
        {/* Provider selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Provider</label>
          <div className="flex rounded-md border overflow-hidden text-xs font-medium w-fit">
            {providers.map(p => (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id)}
                className={`px-3 py-1.5 transition-colors border-l first:border-l-0 ${
                  cfg.provider === p.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {PROVIDER_LABELS[p.id] ?? p.id}
              </button>
            ))}
          </div>
        </div>

        {/* Model name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Model</label>
          <Input
            value={cfg.model}
            onChange={e => update('model', e.target.value)}
            placeholder="e.g. gpt-4o, gemini-2.0-flash"
            className="text-sm max-w-sm"
          />
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">API Key</label>
          <div className="flex gap-2 max-w-sm">
            <Input
              type={showKey ? 'text' : 'password'}
              value={cfg.api_key}
              onChange={e => update('api_key', e.target.value)}
              placeholder="sk-..."
              className="text-sm font-mono"
            />
            <button
              onClick={() => setShowKey(v => !v)}
              className="px-2 text-muted-foreground hover:text-foreground transition-colors"
              title={showKey ? 'Hide' : 'Show'}
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Base URL — always shown so user can verify / override */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Base URL
            {cfg.provider !== 'custom' && (
              <span className="text-xs text-muted-foreground ml-2">(auto-filled)</span>
            )}
          </label>
          <Input
            value={cfg.base_url}
            onChange={e => update('base_url', e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="text-sm font-mono max-w-lg"
            readOnly={cfg.provider !== 'custom'}
          />
        </div>

        <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </section>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ConfigPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [desc, setDesc] = useState('')
  const [action, setAction] = useState<'escalate' | 'draft'>('escalate')
  const [adding, setAdding] = useState(false)

  const fetchRules = useCallback(async () => {
    try { setRules(await getRules()) } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchRules() }, [fetchRules])

  async function handleAdd() {
    if (!desc.trim()) return
    setAdding(true)
    try {
      const rule = await createRule(desc.trim(), action)
      setRules(prev => [rule, ...prev])
      setDesc('')
      toast.success('Rule added')
    } catch { toast.error('Failed to add rule') }
    finally { setAdding(false) }
  }

  async function handleToggle(rule: Rule) {
    try {
      const updated = await updateRule(rule.id, { enabled: !rule.enabled })
      setRules(prev => prev.map(r => (r.id === rule.id ? updated : r)))
    } catch { toast.error('Failed to update rule') }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRule(id)
      setRules(prev => prev.filter(r => r.id !== id))
      toast.success('Rule deleted')
    } catch { toast.error('Failed to delete rule') }
  }

  async function handleReset() {
    try {
      await resetDemo()
      await seedDemo()
      toast.success('Demo reset complete')
    } catch { toast.error('Reset failed') }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center gap-4">
        <a href="/dashboard" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
        </a>
        <Bot className="size-5 text-muted-foreground" />
        <div>
          <h1 className="font-semibold text-base">Lead Agent — Configuration</h1>
          <p className="text-xs text-muted-foreground">
            Manage escalation rules and AI autonomy settings
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* LLM Provider section */}
        <LlmProviderSection />

        <Separator />

        {/* Rules section */}
        <section>
          <div className="mb-4">
            <h2 className="font-semibold text-lg">Escalation &amp; Handoff Rules</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Write rules in plain language. The AI matches conversations against these automatically.
            </p>
          </div>

          {/* Add rule form */}
          <div className="rounded-lg border p-4 bg-muted/30 mb-4">
            <h3 className="text-sm font-medium mb-3">Add new rule</h3>
            <div className="space-y-3">
              <Input
                value={desc}
                onChange={e => setDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="e.g. Escalate when lead mentions financing difficulties"
                className="text-sm"
              />
              <div className="flex items-center gap-3">
                <div className="flex rounded-md border overflow-hidden text-xs font-medium">
                  <button
                    onClick={() => setAction('escalate')}
                    className={`px-3 py-1.5 transition-colors ${action === 'escalate' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                  >
                    Auto-escalate
                  </button>
                  <button
                    onClick={() => setAction('draft')}
                    className={`px-3 py-1.5 transition-colors border-l ${action === 'draft' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                  >
                    Draft only
                  </button>
                </div>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={adding || !desc.trim()}
                  className="ml-auto"
                >
                  <Plus className="size-3" /> Add Rule
                </Button>
              </div>
            </div>
          </div>

          {/* Rule list */}
          <div className="rounded-lg border divide-y overflow-hidden">
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No rules configured yet.
              </p>
            ) : (
              rules.map(rule => (
                <div
                  key={rule.id}
                  className={`flex items-center gap-3 px-4 py-3 ${!rule.enabled ? 'opacity-50' : ''}`}
                >
                  <Switch checked={rule.enabled} onCheckedChange={() => handleToggle(rule)} />
                  <p className="text-sm flex-1 min-w-0">{rule.description}</p>
                  <Badge
                    variant={rule.action === 'escalate' ? 'destructive' : 'secondary'}
                    className="text-[10px] shrink-0"
                  >
                    {rule.action === 'escalate' ? 'escalate' : 'draft'}
                  </Badge>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <Separator />

        {/* Autonomy section */}
        <section>
          <div className="mb-4">
            <h2 className="font-semibold text-lg">AI Autonomy Level</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Control how much the AI acts on its own per lead type.
            </p>
          </div>
          <div className="rounded-lg border divide-y overflow-hidden">
            {AUTONOMY_ROWS.map(row => (
              <AutonomyRow key={row.label} {...row} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Changes apply to the next incoming conversation.
          </p>
        </section>

        <Separator />

        {/* Demo controls */}
        <section>
          <h2 className="font-semibold text-lg mb-1">Demo Controls</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Reset and re-seed the demo database.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}>
              Reset Demo Data
            </Button>
            <Button asChild variant="outline">
              <a href="/dashboard">← Back to Dashboard</a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
