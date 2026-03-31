import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const serviceClient = createServiceClient()

    // Check prospect exists
    const { data: prospect } = await serviceClient
      .from('prospects')
      .select('id, full_name')
      .eq('id', params.id)
      .single()

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
    }

    // Delete related status history first (FK constraint)
    await serviceClient
      .from('prospect_status_history')
      .delete()
      .eq('prospect_id', params.id)

    // Delete the prospect
    const { error: deleteError } = await serviceClient
      .from('prospects')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('[admin/prospects/delete]', deleteError)
      return NextResponse.json({ error: 'Failed to delete prospect' }, { status: 500 })
    }

    // Audit log
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'prospect.deleted',
      target_type: 'prospect',
      target_id: params.id,
      metadata: { full_name: prospect.full_name, deleted_by: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/prospects/delete] Unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
