import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Fetch recent GitHub activity and save to github_activities table
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get GitHub token from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('github_username, github_access_token')
      .eq('id', user.id)
      .single()

    if (!profile?.github_access_token) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
    }

    const headers = {
      'Authorization': `Bearer ${profile.github_access_token}`,
      'Accept': 'application/vnd.github.v3+json'
    }

    // Calculate date 30 days ago
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const sinceISO = since.toISOString()

    const activities = []

    // Fetch PRs created by user
    const prsResponse = await fetch(
      `https://api.github.com/search/issues?q=author:${profile.github_username}+type:pr+created:>${sinceISO.split('T')[0]}&sort=created&per_page=10`,
      { headers }
    )

    if (prsResponse.ok) {
      const prsData = await prsResponse.json()
      for (const pr of prsData.items || []) {
        const repoName = pr.repository_url.split('/').slice(-1)[0]
        activities.push({
          user_id: user.id,
          github_id: `pr-${pr.id}`,
          type: 'pr',
          title: pr.title,
          description: pr.body?.slice(0, 500),
          repo_name: repoName,
          url: pr.html_url,
          occurred_at: pr.created_at
        })
      }
    }

    // Upsert activities to database (avoid duplicates)
    for (const activity of activities) {
      await supabase
        .from('github_activities')
        .upsert(activity, { onConflict: 'github_id' })
    }

    // Return all activities (including ones not yet imported)
    const { data: allActivities } = await supabase
      .from('github_activities')
      .select('*')
      .eq('user_id', user.id)
      .is('imported_to_log_id', null)
      .order('occurred_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ activities: allActivities || [] })
  } catch (error) {
    console.error('Error fetching GitHub activities:', error)
    return NextResponse.json({ error: 'Failed to fetch GitHub activities' }, { status: 500 })
  }
}
