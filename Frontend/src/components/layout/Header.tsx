import { PenLine } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-card)]/80 shadow-sm backdrop-blur">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
        <PenLine className="w-6 h-6 text-[var(--color-primary)]" />
        <span className="font-semibold text-lg">Blog Generator</span>
      </div>
    </header>
  )
}
