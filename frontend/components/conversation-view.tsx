'use client'

import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import type { Message } from '@/lib/api'

type Props = {
  messages: Message[]
  className?: string
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ConversationView({ messages, className }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className={clsx('flex items-center justify-center text-gray-400 text-sm', className)}>
        No messages yet
      </div>
    )
  }

  return (
    <div className={clsx('flex flex-col gap-3 overflow-y-auto px-4 py-3', className)}>
      {messages.map((msg) => {
        const isUser = msg.role === 'user'
        return (
          <div
            key={msg.id}
            className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}
          >
            <div
              className={clsx(
                'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                isUser
                  ? 'bg-gray-200 text-gray-800 rounded-tr-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
              )}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <p
                className={clsx(
                  'text-xs mt-1',
                  isUser ? 'text-gray-500 text-right' : 'text-gray-400'
                )}
              >
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
