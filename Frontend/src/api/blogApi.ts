import axios from 'axios'
import type { BlogRequestPayload, BlogResponse, BlogResponseApi } from '@/types/blog'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      'Something went wrong. Please try again.'
    return Promise.reject(new Error(typeof message === 'string' ? message : JSON.stringify(message)))
  },
)

function mapResponse(data: BlogResponseApi): BlogResponse {
  return {
    blog: data.blog,
    wordCount: data.word_count,
    sources: data.sources ?? [],
    generatedAt: data.generated_at,
  }
}

export const checkHealth = async (): Promise<boolean> => {
  try {
    const { data } = await apiClient.get('/api/v1/health', { timeout: 5000 })
    return data?.status === 'ok'
  } catch {
    return false
  }
}

export const generateBlog = async (payload: BlogRequestPayload): Promise<BlogResponse> => {
  const { data } = await apiClient.post<BlogResponseApi>('/api/v1/blog/generate', payload)
  return mapResponse(data)
}
