import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardContent } from '@/components/features/DashboardContent'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <DashboardContent userId={user.id} />
}
