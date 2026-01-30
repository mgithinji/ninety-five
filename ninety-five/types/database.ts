export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  headline: string | null
  summary: string | null
  github_username: string | null
  github_access_token: string | null
  resume_url: string | null
  skills: string[] | null
  created_at: string
  updated_at: string
}

export interface Experience {
  id: string
  user_id: string
  type: 'job' | 'project' | 'education' | 'volunteer'
  title: string | null
  organization: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
  description: string | null
  original_bullets: string[] | null
  source: 'resume' | 'manual' | 'github'
  created_at: string
  updated_at: string
}

export interface Log {
  id: string
  user_id: string
  experience_id: string | null
  raw_input: string
  input_type: 'text' | 'voice' | 'github' | 'resume'
  processed_bullet: string | null
  category: string | null
  tags: string[] | null
  impact_score: number | null
  occurred_at: string | null
  is_edited: boolean
  needs_review: boolean
  created_at: string
  updated_at: string
  // Joined data
  experience?: Experience
}

export interface GitHubActivity {
  id: string
  user_id: string
  github_id: string
  type: 'commit' | 'pr' | 'issue'
  title: string
  description: string | null
  repo_name: string
  url: string
  occurred_at: string
  imported_to_log_id: string | null
  created_at: string
}

export interface GeneratedResume {
  name: string
  headline: string
  summary: string
  contact: {
    email: string
  }
  experience: Array<{
    title: string
    organization: string
    location: string
    dates: string
    bullets: string[]
  }>
  education: Array<{
    degree: string
    school: string
    dates: string
    details: string | null
  }>
  skills: string[]
}

export interface ResumeGenerationResult {
  resume: GeneratedResume
  tailoring_notes: string[]
  match_score: number
  suggestions: string[]
}
