import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ProspectStatus } from '@/types/database'

export async function POST(
  request: NextRequest,
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

    const body = await request.json()
    const { newStatus, note } = body as { newStatus: ProspectStatus; note: string }

    if (!newStatus) {
      return NextResponse.json({ error: 'newStatus is required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const prospectId = params.id

    // Get current status
    const { data: prospect, error: fetchError } = await serviceClient
      .from('prospects')
      .select('status, full_name')
      .eq('id', prospectId)
      .single()

    if (fetchError || !prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
    }

    const oldStatus = prospect.status

    // Update status
    const { error: updateError } = await serviceClient
      .from('prospects')
      .update({ status: newStatus })
      .eq('id', prospectId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    // Write status history
    await serviceClient.from('prospect_status_history').insert({
      prospect_id: prospectId,
      changed_by: user.id,
      old_status: oldStatus,
      new_status: newStatus,
      note: note ?? null,
    })

    // Write audit log
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'prospect.status_updated',
      target_type: 'prospect',
      target_id: prospectId,
      metadata: { old_status: oldStatus, new_status: newStatus, note },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[update-prospect-status] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
