'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { getLead, sendMessage } from '@/lib/api'
import type { Message } from '@/lib/api'
import { ConversationView } from '@/components/conversation-view'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
      const res = await sendMessage({ message: userMsg.content, channel, lead_id: leadId })
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center gap-3">
        <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-5" />
        </a>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">Your Conversation</h1>
          <p className="text-xs text-muted-foreground truncate">Lead ID: {leadId}</p>
        </div>
        <a href="/dashboard" className="text-xs text-primary hover:underline shrink-0">
          Agent view
        </a>
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm gap-2">
          <Loader2 className="size-4 animate-spin" /> Loading conversation...
        </div>
      )}

      {/* Conversation */}
      {!loading && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ConversationView messages={messages} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="border-t px-4 py-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim() || loading}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
