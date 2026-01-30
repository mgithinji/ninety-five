'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useGitHubConnect() {
  const supabase = createClient()
  const [isConnected, setIsConnected] = useState(false)
  const [username, setUsername] = useState<string | undefined>()

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('github_username')
      .eq('id', user.id)
      .single()

    if (profile?.github_username) {
      setIsConnected(true)
      setUsername(profile.github_username)
    }
  }

  const connect = () => {
    window.location.href = '/api/github/connect'
  }

  const disconnect = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({
        github_username: null,
        github_access_token: null
      })
      .eq('id', user.id)

    setIsConnected(false)
    setUsername(undefined)
  }

  return { isConnected, username, connect, disconnect }
}
