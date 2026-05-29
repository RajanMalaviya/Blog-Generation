import { AlertCircle } from 'lucide-react'

export function ApiStatusBanner() {
  return (
    <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <p>
        API is unreachable. Start the backend with{' '}
        <code className="rounded bg-amber-100 px-1 font-mono text-xs">uvicorn app.main:app --reload --port 8000</code>{' '}
        and set <code className="rounded bg-amber-100 px-1 font-mono text-xs">VITE_API_BASE_URL</code> in{' '}
        <code className="rounded bg-amber-100 px-1 font-mono text-xs">.env</code>.
      </p>
    </div>
  )
}
