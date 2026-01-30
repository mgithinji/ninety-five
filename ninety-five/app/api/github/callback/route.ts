import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// GET: Handle OAuth callback, exchange code for token, save to profile
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?error=github_auth_failed', request.url))
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('GitHub token error:', tokenData)
      return NextResponse.redirect(new URL('/dashboard?error=github_token_failed', request.url))
    }

    const accessToken = tokenData.access_token

    // Get GitHub user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    const githubUser = await userResponse.json()

    // Save to profile
    const supabase = createServiceClient()

    await supabase
      .from('profiles')
      .update({
        github_username: githubUser.login,
        github_access_token: accessToken,
        updated_at: new Date().toISOString()
      })
      .eq('id', state)

    return NextResponse.redirect(new URL('/dashboard?github=connected', request.url))
  } catch (error) {
    console.error('GitHub OAuth error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=github_oauth_error', request.url))
  }
}
