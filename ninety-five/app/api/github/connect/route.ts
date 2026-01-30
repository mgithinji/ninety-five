import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Redirect to GitHub OAuth authorization page
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`
  const scope = 'read:user repo'
  const state = user.id

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
  githubAuthUrl.searchParams.set('client_id', clientId!)
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri)
  githubAuthUrl.searchParams.set('scope', scope)
  githubAuthUrl.searchParams.set('state', state)

  return NextResponse.redirect(githubAuthUrl.toString())
}
