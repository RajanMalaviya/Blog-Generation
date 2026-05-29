import type { ReactNode } from 'react'

interface FormSectionProps {
  label: string
  icon?: ReactNode
  error?: string
  hint?: string
  children: ReactNode
}

export function FormSection({ label, icon, error, hint, children }: FormSectionProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
        {icon}
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      )}
      {error && <p className="text-xs text-[var(--color-destructive)]">{error}</p>}
    </div>
  )
}
