'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, MapPin, BedDouble, Euro, ArrowRight } from 'lucide-react'
import { sendMessage } from '@/lib/api'
import type { Message } from '@/lib/api'
import ConversationView from '@/components/conversation-view'

// ── Static listing data (matches backend seed) ─────────────────────────────

const LISTINGS = [
  {
    id: 'listing-001',
    title: 'Le Marais Apartment',
    type: '2BR',
    price: '€350,000',
    location: 'Paris 3e',
    highlight: 'Parking included',
    gradient: 'from-rose-400 to-pink-600',
  },
  {
    id: 'listing-002',
    title: 'Bastille Studio',
    type: 'Studio',
    price: '€180,000',
    location: 'Paris 11e',
    highlight: 'High ceilings',
    gradient: 'from-violet-400 to-indigo-600',
  },
  {
    id: 'listing-003',
    title: 'République Family Home',
    type: '4BR',
    price: '€650,000',
    location: 'Paris 10e',
    highlight: 'Private garden',
    gradient: 'from-emerald-400 to-teal-600',
  },
] as const

// ── Chat state per listing ─────────────────────────────────────────────────

type ChatState = {
  leadId: string | null
  messages: Message[]
  inputValue: string
  sending: boolean
  error: string | null
}

const defaultChat = (): ChatState => ({
  leadId: null,
  messages: [],
  inputValue: '',
  sending: false,
  error: null,
})

// ── Inline chat form ───────────────────────────────────────────────────────

type ChatFormProps = {
  listing: (typeof LISTINGS)[number]
  name: string
  email: string
  onNameChange: (v: string) => void
  onEmailChange: (v: string) => void
  chat: ChatState
  onChatChange: (c: ChatState | ((prev: ChatState) => ChatState)) => void
}

function ChatForm({ listing, name, email, onNameChange, onEmailChange, chat, onChatChange }: ChatFormProps) {
  const isFirstMessage = chat.leadId === null

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!chat.inputValue.trim() || chat.sending) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: chat.inputValue,
      timestamp: new Date().toISOString(),
    }

    onChatChange((prev) => ({
      ...prev,
      sending: true,
      error: null,
      messages: [...prev.messages, userMsg],
      inputValue: '',
    }))

    try {
      const payload = {
        message: userMsg.content,
        channel: 'web',
        listing_id: listing.id,
        lead_id: chat.leadId ?? undefined,
        ...(isFirstMessage && name ? { name } : {}),
        ...(isFirstMessage && email ? { email } : {}),
      }
      const res = await sendMessage(payload)
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
      }
      onChatChange((prev) => ({
        ...prev,
        leadId: res.lead_id,
        messages: [...prev.messages, assistantMsg],
        sending: false,
      }))
    } catch (err) {
      onChatChange((prev) => ({
        ...prev,
        sending: false,
        error: err instanceof Error ? err.message : 'Failed to send message',
      }))
    }
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
      {isFirstMessage && (
        <div className="grid grid-cols-2 gap-2">
          <input
            required
            value={name}
            onChange={e => onNameChange(e.target.value)}
            placeholder="Your name *"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            required
            type="email"
            value={email}
            onChange={e => onEmailChange(e.target.value)}
            placeholder="Email *"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {chat.messages.length > 0 && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 overflow-hidden">
          <ConversationView messages={chat.messages} className="max-h-64" />
        </div>
      )}

      {chat.error && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-1.5">{chat.error}</p>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={chat.inputValue}
          onChange={e => onChatChange({ ...chat, inputValue: e.target.value })}
          placeholder={
            isFirstMessage
              ? `I'm interested in ${listing.title}`
              : 'Continue the conversation...'
          }
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={chat.sending}
        />
        <button
          type="submit"
          disabled={chat.sending || !chat.inputValue.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {chat.leadId && (
        <p className="text-xs text-gray-400">
          Lead ID: {chat.leadId} ·{' '}
          <Link href="/dashboard" className="text-blue-500 hover:underline">
            View in dashboard
          </Link>
        </p>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const [openListing, setOpenListing] = useState<string | null>(null)
  const [chats, setChats] = useState<Record<string, ChatState>>({})
  const [names, setNames] = useState<Record<string, string>>({})
  const [emails, setEmails] = useState<Record<string, string>>({})

  function getChat(id: string): ChatState {
    return chats[id] ?? defaultChat()
  }

  function setChat(id: string, updater: ChatState | ((prev: ChatState) => ChatState)) {
    setChats(prev => ({
      ...prev,
      [id]: typeof updater === 'function' ? updater(prev[id] ?? defaultChat()) : updater,
    }))
  }

  function toggleListing(id: string) {
    setOpenListing(prev => (prev === id ? null : id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">LeadAgent</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
            Agent Dashboard
          </Link>
          <Link
            href="/config"
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Configure AI
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-16 px-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          AI-Powered Demo
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          AI-Powered Lead Qualification
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Chat with our AI agent to inquire about properties. Watch it qualify leads, detect intent, and autonomously book viewings.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Agent Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/config"
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            Configure Rules
          </Link>
        </div>
      </section>

      {/* Listing cards */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Properties</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LISTINGS.map(listing => {
            const isOpen = openListing === listing.id
            const chat = getChat(listing.id)
            return (
              <div
                key={listing.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
              >
                {/* Gradient placeholder image */}
                <div className={`h-40 bg-gradient-to-br ${listing.gradient} flex items-end p-4`}>
                  <span className="text-white text-xs font-medium bg-black/20 rounded-full px-2.5 py-1">
                    {listing.highlight}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-900 text-lg">{listing.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <BedDouble className="w-4 h-4 text-gray-400" /> {listing.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Euro className="w-4 h-4 text-gray-400" /> {listing.price}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" /> {listing.location}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleListing(listing.id)}
                    className="mt-4 w-full py-2 rounded-lg border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {isOpen ? 'Close Chat' : 'Inquire'}
                  </button>

                  {isOpen && (
                    <ChatForm
                      listing={listing}
                      name={names[listing.id] ?? ''}
                      email={emails[listing.id] ?? ''}
                      onNameChange={v => setNames(prev => ({ ...prev, [listing.id]: v }))}
                      onEmailChange={v => setEmails(prev => ({ ...prev, [listing.id]: v }))}
                      chat={chat}
                      onChatChange={c => setChat(listing.id, c)}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
