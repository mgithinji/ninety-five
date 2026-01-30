import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

const PARSE_PROMPT = `
You are a professional resume parser. Extract ALL information from this resume into structured JSON.

Return this exact JSON structure:
{
  "profile": {
    "full_name": "string",
    "email": "string or null",
    "headline": "string - professional headline like 'Senior Engineer at Company'",
    "summary": "string - professional summary paragraph",
    "skills": ["skill1", "skill2", ...]
  },
  "experiences": [
    {
      "type": "job",
      "title": "Job Title",
      "organization": "Company Name",
      "location": "City, State or Remote",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM or null if current",
      "is_current": true/false,
      "description": "Brief role description if present",
      "bullets": [
        "First accomplishment bullet exactly as written",
        "Second accomplishment bullet exactly as written"
      ]
    },
    {
      "type": "education",
      "title": "Degree Name",
      "organization": "University Name",
      "location": "City, State",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM",
      "is_current": false,
      "description": null,
      "bullets": ["Honors, activities, etc if present"]
    }
  ]
}

Rules:
- Extract ALL jobs, internships, and positions
- Extract ALL education entries
- Preserve bullet points exactly as written (we'll process them separately)
- is_current = true if dates say "Present", "Current", or have no end date
- Parse dates into YYYY-MM format (use "01" for month if only year given)
- Include volunteer work and projects if substantial
- Order experiences by start_date descending (most recent first)

Resume text:
`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Step 1: Get resume URL from profile
    console.log('Step 1: Fetching profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('resume_url')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError
    if (!profile?.resume_url) {
      return NextResponse.json({ error: 'No resume uploaded' }, { status: 400 })
    }

    // Step 2: Download PDF from storage
    console.log('Step 2: Downloading PDF from storage...')
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(profile.resume_url)

    if (downloadError) throw downloadError
    console.log('PDF downloaded successfully, size:', fileData?.size)

    // Step 3: Extract text from PDF using pdfjs-dist
    console.log('Step 3: Extracting text from PDF...')
    const arrayBuffer = await fileData.arrayBuffer()

    // Configure pdfjs-dist worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs'

    // Load PDF document using Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer)
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
    const pdf = await loadingTask.promise

    // Extract text from all pages
    let extractedText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      extractedText += pageText + '\n\n'
    }

    console.log(`Text extracted successfully, length: ${extractedText.length} characters`)

    // Step 4: Use GPT-5.2 to extract resume data from text
    console.log('Step 4: Analyzing resume with GPT-5.2...')

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'user',
          content: `${PARSE_PROMPT}\n\nEXTRACTED RESUME TEXT:\n${extractedText}`
        }
      ],
      max_completion_tokens: 4000
    })

    const message = completion.choices[0]?.message
    if (!message?.content) {
      throw new Error('No response from AI')
    }

    // Parse the JSON from the response
    let parsed
    try {
      // Try to parse directly
      parsed = JSON.parse(message.content)
    } catch {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = message.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1])
      } else {
        throw new Error('Could not parse AI response as JSON')
      }
    }

    console.log('OpenAI response parsed successfully')

    // Step 5: Update profile
    console.log('Step 5: Updating profile...')
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        full_name: parsed.profile.full_name,
        headline: parsed.profile.headline,
        summary: parsed.profile.summary,
        skills: parsed.profile.skills,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateProfileError) throw updateProfileError

    // Step 6: Create experiences and logs
    console.log('Step 6: Creating experiences and logs...')
    for (const exp of parsed.experiences || []) {
      const { data: newExp, error: expError } = await supabase
        .from('experiences')
        .insert({
          user_id: user.id,
          type: exp.type,
          title: exp.title,
          organization: exp.organization,
          location: exp.location,
          start_date: exp.start_date ? `${exp.start_date}-01` : null,
          end_date: exp.end_date ? `${exp.end_date}-01` : null,
          is_current: exp.is_current,
          description: exp.description,
          original_bullets: exp.bullets,
          source: 'resume'
        })
        .select()
        .single()

      if (expError) throw expError

      if (exp.bullets && newExp) {
        for (const bullet of exp.bullets) {
          const { error: logError } = await supabase
            .from('logs')
            .insert({
              user_id: user.id,
              experience_id: newExp.id,
              raw_input: bullet,
              input_type: 'resume',
              processed_bullet: bullet,
              category: 'achievement',
              tags: [],
              impact_score: null
            })

          if (logError) throw logError
        }
      }
    }

    console.log('All steps completed successfully!')

    // Return summary
    return NextResponse.json({
      success: true,
      summary: {
        name: parsed.profile.full_name,
        experienceCount: parsed.experiences?.filter((e: any) => e.type === 'job').length || 0,
        educationCount: parsed.experiences?.filter((e: any) => e.type === 'education').length || 0,
        skillCount: parsed.profile.skills?.length || 0
      }
    })
  } catch (error: any) {
    console.error('Parse error:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)

    // Handle OpenAI API errors
    if (error.status === 401) {
      return NextResponse.json({
        error: 'OpenAI API key is invalid',
        details: 'Please check your OPENAI_API_KEY environment variable'
      }, { status: 500 })
    }

    if (error.status === 429) {
      return NextResponse.json({
        error: 'OpenAI rate limit exceeded',
        details: 'Please try again in a moment'
      }, { status: 500 })
    }

    // Handle file-related errors
    if (error.message?.includes('file') || error.message?.includes('File')) {
      return NextResponse.json({
        error: 'Failed to process resume file',
        details: error.message
      }, { status: 500 })
    }

    // Generic error handling
    return NextResponse.json({
      error: 'Failed to parse resume',
      details: error.message || String(error)
    }, { status: 500 })
  }
}
