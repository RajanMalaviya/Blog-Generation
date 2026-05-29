import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline'
  size?: 'default' | 'lg' | 'sm'
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variant === 'default' &&
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90',
        variant === 'outline' &&
          'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-card)]',
        size === 'default' && 'h-10 px-4 py-2 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        size === 'sm' && 'h-8 px-3 text-xs',
        className,
      )}
      {...props}
    />
  )
}
