import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { BlogActions } from '@/components/result/BlogActions'
import { WordCount } from '@/components/result/WordCount'
import type { BlogResponse } from '@/types/blog'

interface BlogResultProps {
  result: BlogResponse
}

export function BlogResult({ result }: BlogResultProps) {
  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <WordCount count={result.wordCount} />
        <BlogActions content={result.blog} />
      </CardHeader>
      <CardContent>
        <article className="prose prose-slate max-w-none">
          <ReactMarkdown>{result.blog}</ReactMarkdown>
        </article>

        {result.sources.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
            <p className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2">
              Sources used for research
            </p>
            <ul className="space-y-1">
              {result.sources.map((url, i) => (
                <li key={i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--color-primary)] hover:underline break-all"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
