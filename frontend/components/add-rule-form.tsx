'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { createRule } from '@/lib/api'
import type { Rule } from '@/lib/api'

type Props = {
  onAdded: (rule: Rule) => void
}

export default function AddRuleForm({ onAdded }: Props) {
  const [description, setDescription] = useState('')
  const [action, setAction] = useState<'escalate' | 'draft'>('escalate')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const rule = await createRule(description.trim(), action)
      onAdded(rule)
      setDescription('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create rule')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-4 space-y-3">
      <p className="text-sm font-medium text-gray-700">Add New Rule</p>

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g. Escalate when lead mentions financing difficulties"
        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* Segmented control */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => setAction('escalate')}
          className={clsx(
            'px-4 py-1.5 text-sm font-medium transition-colors',
            action === 'escalate'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          Auto-escalate
        </button>
        <button
          type="button"
          onClick={() => setAction('draft')}
          className={clsx(
            'px-4 py-1.5 text-sm font-medium border-l border-gray-200 transition-colors',
            action === 'draft'
              ? 'bg-amber-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          Draft only
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !description.trim()}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-4 h-4" />
        {submitting ? 'Adding...' : 'Add Rule'}
      </button>
    </form>
  )
}
