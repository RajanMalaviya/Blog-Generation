import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

const STATUS_MESSAGES = [
  'Searching the web for latest data...',
  'Analyzing relevant sources...',
  'Building blog structure...',
  'Writing your blog with AI...',
  'Polishing the content...',
]

export function LoadingOverlay() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
      <p className="text-[var(--color-muted-foreground)] text-sm animate-pulse">
        {STATUS_MESSAGES[messageIndex]}
      </p>
    </div>
  )
}
