import { useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface KeywordsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  maxTags: number
  placeholder?: string
  label?: string
}

function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function KeywordsInput({
  value,
  onChange,
  maxTags,
  placeholder = 'e.g. ai healthcare',
  label = 'keyword',
}: KeywordsInputProps) {
  const [inputValue, setInputValue] = useState('')
  const atMax = value.length >= maxTags
  const remaining = maxTags - value.length

  const addKeywords = (raw: string) => {
    const incoming = parseKeywords(raw)
    if (incoming.length === 0) return

    const next = [...value]
    for (const tag of incoming) {
      if (next.length >= maxTags) break
      if (!next.includes(tag)) next.push(tag)
    }
    onChange(next)
    setInputValue('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleAddClick = () => {
    addKeywords(inputValue)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeywords(inputValue)
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (!/[,;\n]/.test(pasted)) return
    e.preventDefault()
    addKeywords(pasted)
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'min-h-[52px] rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2 transition-colors',
          value.length > 0 && 'pb-1',
        )}
      >
        {value.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {value.map((tag) => (
              <Badge
                key={tag}
                className="gap-1 border border-[var(--color-border)] bg-[var(--color-muted)] pr-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="rounded p-0.5 hover:bg-[var(--color-background)] hover:text-[var(--color-destructive)]"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mb-2 px-1 text-xs text-[var(--color-muted-foreground)]">
            No {label}s yet — type below and click Add, or paste a comma-separated list.
          </p>
        )}

        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={() => inputValue.trim() && addKeywords(inputValue)}
            placeholder={atMax ? `Maximum ${maxTags} reached` : placeholder}
            disabled={atMax}
            aria-label={`Add ${label}`}
            className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddClick}
            disabled={atMax || !inputValue.trim()}
            className="shrink-0 gap-1"
            aria-label={`Add ${label}`}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        <span className="font-medium text-[var(--color-foreground)]">
          {value.length} / {maxTags}
        </span>{' '}
        added
        {!atMax && remaining > 0 && (
          <>
            {' '}
            · comma-separated paste works ·{' '}
            <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-1 py-0.5 text-[10px] font-sans">
              Enter
            </kbd>{' '}
            also adds
          </>
        )}
      </p>
    </div>
  )
}
