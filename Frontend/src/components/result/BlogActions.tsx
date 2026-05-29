import { useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'

interface BlogActionsProps {
  content: string
}

export function BlogActions({ content }: BlogActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'generated-blog.md'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded as Markdown!')
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" type="button" onClick={handleCopy}>
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
      </Button>
      <Button variant="outline" size="sm" type="button" onClick={handleDownload}>
        <Download className="w-4 h-4" />
        <span className="ml-1">Download</span>
      </Button>
    </div>
  )
}
