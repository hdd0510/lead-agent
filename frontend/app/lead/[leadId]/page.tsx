'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getLead, sendMessage } from '@/lib/api'
import type { Message } from '@/lib/api'
import ConversationView from '@/components/conversation-view'

type Props = {
  params: Promise<{ leadId: string }>
}

export default function LeadChatPage({ params }: Props) {
  const { leadId } = use(params)

  const [messages, setMessages] = useState<Message[]>([])
  const [channel, setChannel] = useState('web')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getLead(leadId)
      setMessages(data.messages)
      setChannel(data.lead.channel)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load conversation')
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)
    setError(null)

    try {
      const res = await sendMessage({
        message: userMsg.content,
        channel,
        lead_id: leadId,
      })
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      // Remove optimistic user message on failure
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 truncate">Your Conversation</h1>
          <p className="text-xs text-gray-500 truncate">Lead ID: {leadId}</p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs text-blue-600 hover:underline shrink-0"
        >
          Agent view
        </Link>
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Loading conversation...
        </div>
      )}

      {/* Conversation */}
      {!loading && (
        <ConversationView
          messages={messages}
          className="flex-1 py-4"
        />
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || loading}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim() || loading}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
