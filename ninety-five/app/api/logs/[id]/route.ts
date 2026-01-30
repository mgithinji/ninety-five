import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH: Update a log
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const updates = await request.json()

    // Only allow updating certain fields
    const allowedFields = ['raw_input', 'processed_bullet', 'experience_id', 'category', 'tags', 'occurred_at']
    const sanitizedUpdates: any = { is_edited: true, updated_at: new Date().toISOString() }

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field]
      }
    }

    const { data: log, error } = await supabase
      .from('logs')
      .update(sanitizedUpdates)
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)
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
    console.error('Error updating log:', error)
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 })
  }
}

// DELETE: Delete a log
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting log:', error)
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 })
  }
}
