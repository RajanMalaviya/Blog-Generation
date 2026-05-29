export type ToneOption =
  | 'professional'
  | 'conversational'
  | 'academic'
  | 'humorous'
  | 'persuasive'

export type LengthOption = 'short' | 'medium' | 'long'

export type LanguageOption = 'english' | 'hindi' | 'spanish' | 'french' | 'german'

export interface BlogFormValues {
  title: string
  primaryKeywords: string[]
  secondaryKeywords: string[]
  targetAudience: string
  tone: ToneOption
  length: LengthOption
  language: LanguageOption
  additionalContext?: string
}

export interface BlogRequestPayload {
  title: string
  primary_keywords: string[]
  secondary_keywords: string[]
  target_audience: string
  tone: ToneOption
  length: LengthOption
  language: LanguageOption
  additional_context?: string | null
}

export interface BlogResponseApi {
  blog: string
  word_count: number
  sources: string[]
  generated_at: string
}

export interface BlogResponse {
  blog: string
  wordCount: number
  sources: string[]
  generatedAt: string
}
