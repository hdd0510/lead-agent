'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 p-8 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <pre className="text-xs bg-muted rounded p-4 max-w-2xl overflow-auto text-left whitespace-pre-wrap">
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
      >
        Try again
      </button>
    </div>
  )
}
