import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Import a GitHub activity as a work log
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { activityId } = await request.json()

    // Get the activity
    const { data: activity } = await supabase
      .from('github_activities')
      .select('*')
      .eq('id', activityId)
      .eq('user_id', user.id)
      .single()

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Create the raw input for AI processing
    const rawInput = activity.type === 'pr'
      ? `Opened PR: ${activity.title} in ${activity.repo_name}`
      : `Committed: ${activity.title} to ${activity.repo_name}`

    // Call the logs API to create the log
    const logResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        raw_input: rawInput,
        input_type: 'github'
      })
    })

    const logData = await logResponse.json()

    if (logData.log) {
      // Mark activity as imported
      await supabase
        .from('github_activities')
        .update({ imported_to_log_id: logData.log.id })
        .eq('id', activityId)
    }

    return NextResponse.json(logData)
  } catch (error) {
    console.error('Error importing GitHub activity:', error)
    return NextResponse.json({ error: 'Failed to import activity' }, { status: 500 })
  }
}
