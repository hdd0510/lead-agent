// Server-side proxy — routes /proxy/* → backend
// BACKEND_URL is read at request time (not build time), so Docker env vars work correctly
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000'

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const target = `${BACKEND}/${path.join('/')}${req.nextUrl.search}`

  const headers = new Headers()
  const contentType = req.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'

  try {
    const res = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // @ts-expect-error — Node 18+ fetch requires duplex for streaming body
      duplex: 'half',
    })

    const responseHeaders = new Headers()
    res.headers.forEach((v, k) => {
      if (!['transfer-encoding', 'connection'].includes(k)) responseHeaders.set(k, v)
    })

    return new NextResponse(res.body, { status: res.status, headers: responseHeaders })
  } catch (err) {
    console.error('[proxy] backend unreachable:', target, err)
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 })
  }
}

export const GET = proxy
export const POST = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
