import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { BlogForm } from '@/components/form/BlogForm'
import { Header } from '@/components/layout/Header'
import { BlogResult } from '@/components/result/BlogResult'
import { ApiStatusBanner } from '@/components/shared/ApiStatusBanner'
import { LoadingOverlay } from '@/components/shared/LoadingOverlay'
import { useApiHealth } from '@/hooks/useApiHealth'
import { useBlogGeneration } from '@/hooks/useBlogGeneration'
import type { BlogRequestPayload } from '@/types/blog'

const queryClient = new QueryClient()

function BlogPage() {
  const { mutate, data, isPending, error, reset } = useBlogGeneration()
  const { data: apiHealthy, isLoading: healthLoading } = useApiHealth()

  const handleGenerate = (payload: BlogRequestPayload) => {
    reset()
    mutate(payload)
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">AI Blog Generator</h1>
          <p className="text-[var(--color-muted-foreground)] mt-2">
            Generate research-backed blogs using real-time web search and AI.
          </p>
        </div>

        {!healthLoading && apiHealthy === false && <ApiStatusBanner />}

        <BlogForm onSubmit={handleGenerate} isLoading={isPending} />

        {isPending && <LoadingOverlay />}
        {data && !isPending && <BlogResult result={data} />}
        {error && !isPending && (
          <div className="mt-6 p-4 rounded-lg bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm">
            {error.message}
          </div>
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BlogPage />
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}
