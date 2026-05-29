import { z } from 'zod'

export const blogFormSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(150, 'Title must be under 150 characters'),
  primaryKeywords: z
    .array(z.string().min(1))
    .min(1, 'Add at least one primary keyword')
    .max(5, 'Maximum 5 primary keywords'),
  secondaryKeywords: z.array(z.string().min(1)).max(10, 'Maximum 10 secondary keywords'),
  targetAudience: z
    .string()
    .min(3, 'Describe your target audience')
    .max(100, 'Keep it under 100 characters'),
  tone: z.enum(['professional', 'conversational', 'academic', 'humorous', 'persuasive']),
  length: z.enum(['short', 'medium', 'long']),
  language: z.enum(['english', 'hindi', 'spanish', 'french', 'german']),
  additionalContext: z.string().max(500).optional(),
})

export type BlogFormSchema = z.infer<typeof blogFormSchema>
