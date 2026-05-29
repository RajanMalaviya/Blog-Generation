import { useQuery } from '@tanstack/react-query'
import { checkHealth } from '@/api/blogApi'

export const useApiHealth = () => {
  return useQuery({
    queryKey: ['api-health'],
    queryFn: checkHealth,
    refetchInterval: 60000,
    retry: 1,
  })
}
