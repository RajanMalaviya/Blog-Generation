import { Badge } from '@/components/ui/Badge'

export function WordCount({ count }: { count: number }) {
  return <Badge>{count.toLocaleString()} words</Badge>
}
