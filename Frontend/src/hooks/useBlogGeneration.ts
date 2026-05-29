import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { generateBlog } from '@/api/blogApi'
import type { BlogRequestPayload, BlogResponse } from '@/types/blog'

export const useBlogGeneration = () => {
  return useMutation<BlogResponse, Error, BlogRequestPayload>({
    mutationFn: generateBlog,
    onSuccess: () => {
      toast.success('Blog generated successfully!')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
