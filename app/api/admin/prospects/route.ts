import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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
    const { introducerId, fullName, email, phone, country, sourceNote, notes, startCoolingOff } = body

    if (!introducerId || !fullName || !email) {
      return NextResponse.json(
        { error: 'introducerId, fullName, and email are required' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    const now = new Date()
    const coolingOffEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { data: prospect, error: insertError } = await serviceClient
      .from('prospects')
      .insert({
        introducer_id: introducerId,
        full_name: fullName,
        email,
        phone: phone ?? null,
        country: country ?? null,
        source_note: sourceNote ?? null,
        notes: notes ?? null,
        status: startCoolingOff ? 'cooling_off' : 'registered',
        cooling_off_started_at: startCoolingOff ? now.toISOString() : null,
        cooling_off_completed_at: startCoolingOff ? coolingOffEnd.toISOString() : null,
      })
      .select()
      .single()

    if (insertError || !prospect) {
      console.error('[admin-create-prospect]', insertError?.message)
      return NextResponse.json({ error: 'Failed to create prospect' }, { status: 500 })
    }

    // Initial status history
    await serviceClient.from('prospect_status_history').insert({
      prospect_id: prospect.id,
      changed_by: user.id,
      old_status: null,
      new_status: startCoolingOff ? 'cooling_off' : 'registered',
      note: 'Prospect created manually by admin',
    })

    // Audit log
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'prospect.created',
      target_type: 'prospect',
      target_id: prospect.id,
      metadata: { full_name: fullName, email, introducer_id: introducerId },
    })

    return NextResponse.json({ success: true, prospect })
  } catch (error) {
    console.error('[admin-create-prospect] Unexpected:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
