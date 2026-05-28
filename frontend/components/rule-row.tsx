'use client'

import { useState } from 'react'
import { Trash2, Pencil, Check, X } from 'lucide-react'
import { clsx } from 'clsx'
import { updateRule, deleteRule } from '@/lib/api'
import type { Rule } from '@/lib/api'

type Props = {
  rule: Rule
  onUpdate: (updated: Rule) => void
  onDelete: (id: string) => void
}

const ACTION_STYLES = {
  escalate: 'bg-red-100 text-red-700',
  draft: 'bg-amber-100 text-amber-700',
}

export default function RuleRow({ rule, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(rule.description)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    setToggling(true)
    setError(null)
    try {
      const updated = await updateRule(rule.id, { enabled: !rule.enabled })
      onUpdate(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setToggling(false)
    }
  }

  async function handleSaveEdit() {
    if (!editText.trim()) return
    try {
      const updated = await updateRule(rule.id, { description: editText.trim() })
      onUpdate(updated)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this rule?')) return
    setDeleting(true)
    try {
      await deleteRule(rule.id)
      onDelete(rule.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-start gap-3 py-3 px-4 border-b border-gray-100 last:border-0">
      {/* Toggle */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={clsx(
          'mt-0.5 relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors',
          rule.enabled ? 'bg-blue-600' : 'bg-gray-300',
          toggling && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Toggle rule"
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
            rule.enabled ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>

      {/* Description */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit()
                if (e.key === 'Escape') { setEditing(false); setEditText(rule.description) }
              }}
              className="flex-1 text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-700">
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setEditing(false); setEditText(rule.description) }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className={clsx('text-sm', !rule.enabled && 'text-gray-400 line-through')}>
            {rule.description}
          </p>
        )}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>

      {/* Action badge */}
      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', ACTION_STYLES[rule.action])}>
        {rule.action === 'escalate' ? 'Escalate' : 'Draft'}
      </span>

      {/* Edit / Delete */}
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          aria-label="Edit rule"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
          aria-label="Delete rule"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
