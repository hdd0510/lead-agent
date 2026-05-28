'use client'
import { useState } from 'react'
import { Bot, Workflow, MapPin, Bed, Euro, ChevronRight, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { sendMessage } from '@/lib/api'
import { toast } from 'sonner'

const LISTINGS = [
  {
    id: 'le-marais-apt',
    title: 'Le Marais Apartment',
    price: 350000,
    bedrooms: 2,
    area: 'Paris 3e',
    description: '65m² apartment in Le Marais. Renovated kitchen, south-facing balcony, parking included.',
    features: ['Parking included', 'South balcony', 'Renovated kitchen'],
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'bastille-studio',
    title: 'Bastille Studio',
    price: 180000,
    bedrooms: 0,
    area: 'Paris 11e',
    description: '28m² studio, 5 min from Bastille metro. High ceilings and exposed brick walls.',
    features: ['High ceilings', 'Exposed brick', 'Metro nearby'],
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'republique-family',
    title: 'République Family Home',
    price: 650000,
    bedrooms: 4,
    area: 'Paris 10e',
    description: '140m² townhouse with private garden near Place de la République.',
    features: ['Private garden', '4 bedrooms', 'Cellar included'],
    gradient: 'from-emerald-500 to-teal-600',
  },
]

type Message = { role: 'user' | 'assistant'; content: string }

function ListingCard({ listing }: { listing: typeof LISTINGS[0] }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [leadId, setLeadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(`I'm interested in the ${listing.title}`)
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!input.trim() || loading) return
    if (!leadId && (!name.trim() || !email.trim())) {
      toast.error('Please enter your name and email first')
      return
    }
    const userMsg = input.trim()
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    try {
      const res = await sendMessage({
        message: userMsg,
        channel: 'webform',
        listing_id: listing.id,
        name: name || undefined,
        email: email || undefined,
        lead_id: leadId || undefined,
      })
      setLeadId(res.lead_id)
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }])
    } catch {
      toast.error('Failed to send message')
      setMessages(prev => prev.slice(0, -1))
      setInput(userMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className={`h-40 bg-gradient-to-br ${listing.gradient} relative flex items-end p-4`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative">
          <h3 className="text-white font-semibold text-lg leading-tight">{listing.title}</h3>
          <div className="flex items-center gap-1 text-white/90 text-sm mt-0.5">
            <MapPin className="size-3" />
            <span>{listing.area}</span>
          </div>
        </div>
      </div>

      <CardContent className="flex flex-col flex-1 gap-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 font-bold text-xl">
            <Euro className="size-4 text-muted-foreground" />
            {listing.price.toLocaleString()}
          </div>
          {listing.bedrooms > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Bed className="size-4" />
              {listing.bedrooms} bed{listing.bedrooms > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {listing.features.map(f => (
            <Badge key={f} variant="secondary" className="text-xs font-normal">{f}</Badge>
          ))}
        </div>

        {!open ? (
          <Button onClick={() => setOpen(true)} className="mt-auto w-full" size="sm">
            Inquire about this property <ChevronRight className="size-3" />
          </Button>
        ) : (
          <div className="flex flex-col gap-3 mt-auto border-t pt-4">
            {!leadId && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor={`name-${listing.id}`} className="text-xs">Name *</Label>
                  <Input
                    id={`name-${listing.id}`}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jean-Pierre"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`email-${listing.id}`} className="text-xs">Email *</Label>
                  <Input
                    id={`email-${listing.id}`}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jp@example.com"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto text-sm">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg px-3 py-2 max-w-[85%] leading-snug ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground border'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted border rounded-lg px-3 py-2 flex items-center gap-2 text-muted-foreground text-xs">
                      <Loader2 className="size-3 animate-spin" /> Thinking...
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                rows={2}
                placeholder="Type your message..."
                className="text-sm resize-none"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="shrink-0 self-end"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="bg-primary text-primary-foreground py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-2 bg-primary-foreground/10 rounded-lg">
              <Bot className="size-8" />
            </div>
            <div className="p-2 bg-primary-foreground/10 rounded-lg">
              <Workflow className="size-8" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Lead Agent</h1>
          <p className="text-lg text-primary-foreground/70 max-w-2xl mx-auto">
            AI-powered lead qualification for real estate agencies. Respond to every inquiry in seconds,
            qualify leads automatically, and book viewings while you sleep.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">Featured Properties</h2>
          <p className="text-muted-foreground mt-1">Select a property and chat with our AI assistant to get started.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LISTINGS.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>

        <div className="mt-12 rounded-xl border bg-muted/40 p-8 text-center">
          <h3 className="font-semibold text-lg mb-2">Are you a real estate agent?</h3>
          <p className="text-muted-foreground text-sm mb-4">View your qualified leads dashboard and manage your pipeline.</p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="default">
              <a href="/dashboard">Open Dashboard</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/config">Configure Rules</a>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
