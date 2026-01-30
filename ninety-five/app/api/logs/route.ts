import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'
import type { ChatCompletion } from 'openai/resources/chat/completions'

const ENHANCE_PROMPT = `
You are processing a work accomplishment log entry. Your job is to:
1. Transform it into a professional, impactful STAR-format bullet point
2. Determine which experience/job this belongs to
3. Categorize and tag it

USER'S EXPERIENCES:
{{EXPERIENCES}}

NEW LOG ENTRY:
"{{INPUT}}"

Instructions:
- Create a concise bullet point (1-2 sentences max)
- Quantify impact if numbers are mentioned or can be reasonably inferred
- Use strong action verbs (Led, Shipped, Built, Reduced, Increased, etc.)
- Match to the most likely experience based on context clues
- If unclear, default to the current position (is_current = true)
- If no experiences exist, set experience_id to null

Return ONLY this JSON:
{
  "processed_bullet": "Shipped new onboarding flow, reducing user drop-off by 40% and improving time-to-value",
  "experience_id": "uuid-of-matching-experience or null",
  "match_confidence": 0.95,
  "category": "launch|achievement|collaboration|learning|impact|process",
  "tags": ["onboarding", "user-experience", "conversion"],
  "impact_score": 4,
  "occurred_at": "2024-01-15 or null if unclear"
}

Categories explained:
- launch: Shipped a feature, product, or project
- achievement: Hit a milestone, received recognition
- collaboration: Mentoring, cross-team work, leadership
- learning: New skill, certification, training
- impact: Metrics improvement, cost savings, efficiency gains
- process: Improved workflows, documentation, systems

Impact score (1-5):
1 = Minor task completion
2 = Meaningful contribution
3 = Significant achievement
4 = Major impact on team/project
5 = Transformative impact on organization
`

// GET: List all logs for user
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: logs } = await supabase
      .from('logs')
      .select(`
        *,
        experience:experiences(id, title, organization, is_current)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ logs: logs || [] })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

// POST: Create new log with AI enhancement
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { raw_input, input_type = 'text' } = await request.json()

    if (!raw_input?.trim()) {
      return NextResponse.json({ error: 'Input required' }, { status: 400 })
    }

    // Fetch user's experiences for context
    const { data: experiences } = await supabase
      .from('experiences')
      .select('id, title, organization, start_date, end_date, is_current')
      .eq('user_id', user.id)
      .order('is_current', { ascending: false })
      .order('start_date', { ascending: false })

    // Build experiences context for AI
    const experiencesContext = experiences?.map(e =>
      `- ID: ${e.id} | ${e.title} @ ${e.organization} (${e.start_date?.split('-')[0] || ''} - ${e.is_current ? 'Present' : e.end_date?.split('-')[0] || ''})`
    ).join('\n') || 'No experiences found'

    // Call OpenAI for enhancement
    const prompt = ENHANCE_PROMPT
      .replace('{{EXPERIENCES}}', experiencesContext)
      .replace('{{INPUT}}', raw_input)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional resume writer. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })

    // Type guard to ensure we have a ChatCompletion with choices
    const message = 'choices' in completion 
      ? completion.choices[0]?.message 
      : null

    if (!message?.content) {
      throw new Error('No response from AI')
    }

    const enhanced = JSON.parse(message.content)

    // Create the log
    const { data: log, error } = await supabase
      .from('logs')
      .insert({
        user_id: user.id,
        experience_id: enhanced.experience_id,
        raw_input,
        input_type,
        processed_bullet: enhanced.processed_bullet,
        category: enhanced.category,
        tags: enhanced.tags,
        impact_score: enhanced.impact_score,
        occurred_at: enhanced.occurred_at,
        needs_review: enhanced.match_confidence < 0.7
      })
      .select(`
        *,
        experience:experiences(id, title, organization, is_current)
      `)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Error creating log:', error)
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 })
  }
}
