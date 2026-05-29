import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlignLeft,
  FileText,
  Globe,
  MessageSquare,
  Mic,
  Sparkles,
  Tag,
  Tags,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { FormSection } from '@/components/form/FormSection'
import { KeywordsInput } from '@/components/form/KeywordsInput'
import { blogFormSchema, type BlogFormSchema } from '@/lib/validators'
import type { BlogRequestPayload } from '@/types/blog'

interface BlogFormProps {
  onSubmit: (payload: BlogRequestPayload) => void
  isLoading: boolean
}

function toApiPayload(data: BlogFormSchema): BlogRequestPayload {
  return {
    title: data.title,
    primary_keywords: data.primaryKeywords,
    secondary_keywords: data.secondaryKeywords,
    target_audience: data.targetAudience,
    tone: data.tone,
    length: data.length,
    language: data.language,
    additional_context: data.additionalContext || null,
  }
}

export function BlogForm({ onSubmit, isLoading }: BlogFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<BlogFormSchema>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      tone: 'professional',
      length: 'medium',
      language: 'english',
      primaryKeywords: [],
      secondaryKeywords: [],
    },
  })

  const primaryKeywords = watch('primaryKeywords')
  const secondaryKeywords = watch('secondaryKeywords')

  const handleFormSubmit = (data: BlogFormSchema) => {
    onSubmit(toApiPayload(data))
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <FormSection
        label="Blog Title"
        icon={<FileText className="w-4 h-4 text-[var(--color-muted-foreground)]" />}
        error={errors.title?.message}
      >
        <Input
          {...register('title')}
          placeholder="e.g. The Future of AI in Healthcare 2025"
        />
      </FormSection>

      <FormSection
        label="Primary Keywords"
        icon={<Tag className="w-4 h-4 text-[var(--color-muted-foreground)]" />}
        error={errors.primaryKeywords?.message}
        hint="Main SEO terms — add up to 5"
      >
        <KeywordsInput
          value={primaryKeywords}
          onChange={(tags) => setValue('primaryKeywords', tags, { shouldValidate: true })}
          maxTags={5}
          label="primary keyword"
          placeholder="e.g. artificial intelligence"
        />
      </FormSection>

      <FormSection
        label="Secondary Keywords"
        icon={<Tags className="w-4 h-4 text-[var(--color-muted-foreground)]" />}
        error={errors.secondaryKeywords?.message}
        hint="Supporting terms (optional) — add up to 10"
      >
        <KeywordsInput
          value={secondaryKeywords}
          onChange={(tags) => setValue('secondaryKeywords', tags, { shouldValidate: true })}
          maxTags={10}
          label="secondary keyword"
          placeholder="e.g. machine learning, diagnostics"
        />
      </FormSection>

      <FormSection
        label="Target Audience"
        icon={<Users className="w-4 h-4 text-[var(--color-muted-foreground)]" />}
        error={errors.targetAudience?.message}
      >
        <Input
          {...register('targetAudience')}
          placeholder="e.g. Software developers, startup founders"
        />
      </FormSection>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormSection
          label="Tone"
          icon={<Mic className="w-4 h-4 text-[var(--color-muted-foreground)]" />}
        >
          <Controller
            name="tone"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormSection>

        <FormSection
          label="Length"
          icon={<AlignLeft className="w-4 h-4 text-[var(--color-muted-foreground)]" />}
        >
          <Controller
            name="length"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (~500 words)</SelectItem>
                  <SelectItem value="medium">Medium (~1000 words)</SelectItem>
                  <SelectItem value="long">Long (~2000 words)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormSection>

        <FormSection
          label="Language"
          icon={<Globe className="w-4 h-4 text-[var(--color-muted-foreground)]" />}
        >
          <Controller
            name="language"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormSection>
      </div>

      <FormSection
        label="Additional Instructions"
        icon={<MessageSquare className="w-4 h-4 text-[var(--color-muted-foreground)]" />}
        hint="Optional — extra guidance for the AI"
      >
        <Textarea
          {...register('additionalContext')}
          placeholder="e.g. Name 3 companies, include HIPAA compliance angle, emphasize RAG for developers..."
        />
      </FormSection>

      <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Generating your blog...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Blog
          </>
        )}
      </Button>
    </form>
  )
}
