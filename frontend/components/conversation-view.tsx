import { Message } from '@/lib/api'
import { Bot, User } from 'lucide-react'

export function ConversationView({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-4">No messages yet.</p>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {messages.map((m, i) => (
        <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          <div
            className={`size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              m.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted border'
            }`}
          >
            {m.role === 'user' ? <User className="size-3" /> : <Bot className="size-3" />}
          </div>
          <div
            className={`rounded-xl px-3.5 py-2.5 text-sm max-w-[80%] leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-muted border rounded-tl-sm'
            }`}
          >
            {m.content}
          </div>
        </div>
      ))}
    </div>
  )
}
