import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'

const GENERATE_PROMPT = `
You are an expert resume writer and career coach. Create a tailored resume for a specific job application.

CURRENT RESUME DATA:
{{RESUME_DATA}}

RECENT WORK LOGS (accomplishments not yet on resume):
{{LOGS}}

TARGET POSITION:
Title: {{JOB_TITLE}}
Company: {{COMPANY}}
Job Description:
{{JOB_DESCRIPTION}}

INSTRUCTIONS:
1. Create a tailored resume optimized for this specific role
2. Incorporate relevant recent logs as new bullet points
3. Rewrite existing bullets to emphasize relevant skills and experience
4. Adjust the professional summary to align with the role
5. Reorder skills to prioritize those mentioned in the job description
6. Keep it honest - don't fabricate experience
7. Optimize for ATS (applicant tracking systems)
8. Aim for 1 page of content

Return JSON:
{
  "resume": {
    "name": "Full Name",
    "headline": "Tailored headline for this role",
    "summary": "2-3 sentence professional summary tailored to this role",
    "contact": {
      "email": "email if available"
    },
    "experience": [
      {
        "title": "Job Title",
        "organization": "Company",
        "location": "Location",
        "dates": "Start - End",
        "bullets": [
          "Tailored accomplishment bullet 1",
          "Tailored accomplishment bullet 2"
        ]
      }
    ],
    "education": [
      {
        "degree": "Degree",
        "school": "University",
        "dates": "Start - End",
        "details": "Honors, relevant coursework, etc (if applicable)"
      }
    ],
    "skills": ["Skill 1", "Skill 2", "..."]
  },
  "tailoring_notes": [
    "Emphasized X experience because the role requires Y",
    "Added recent accomplishment about Z from your logs",
    "Reordered skills to highlight TypeScript first"
  ],
  "match_score": 85,
  "suggestions": [
    "Consider adding more detail about your experience with X",
    "The role mentions Y which you haven't highlighted"
  ]
}
`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { job_title, company, job_description } = await request.json()

    // Fetch all user data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: experiences } = await supabase
      .from('experiences')
      .select('*')
      .eq('user_id', user.id)
      .order('is_current', { ascending: false })
      .order('start_date', { ascending: false })

    const { data: logs } = await supabase
      .from('logs')
      .select('*, experience:experiences(id, title, organization)')
      .eq('user_id', user.id)
      .order('impact_score', { ascending: false })

    // Build comprehensive context
    const currentResume = {
      profile: {
        name: profile?.full_name,
        headline: profile?.headline,
        summary: profile?.summary,
        skills: profile?.skills
      },
      experiences: experiences?.map(exp => ({
        type: exp.type,
        title: exp.title,
        organization: exp.organization,
        dates: `${exp.start_date?.split('-').slice(0, 2).join('/') || ''} - ${exp.is_current ? 'Present' : exp.end_date?.split('-').slice(0, 2).join('/') || ''}`,
        originalBullets: exp.original_bullets,
        recentLogs: logs?.filter(l => l.experience_id === exp.id).map(l => l.processed_bullet)
      }))
    }

    const prompt = GENERATE_PROMPT
      .replace('{{RESUME_DATA}}', JSON.stringify(currentResume, null, 2))
      .replace('{{LOGS}}', logs?.filter(l => l.input_type !== 'resume').map(l => `- ${l.processed_bullet} (${l.category}, impact: ${l.impact_score}/5)`).join('\n') || 'None')
      .replace('{{JOB_TITLE}}', job_title)
      .replace('{{COMPANY}}', company)
      .replace('{{JOB_DESCRIPTION}}', job_description)

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume writer. Return only valid JSON. Be specific and quantitative in bullet points.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })

    const message = completion.choices[0]?.message
    if (!message?.content) {
      throw new Error('No response from AI')
    }

    const result = JSON.parse(message.content)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Resume generation error:', error)
    return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 })
  }
}
