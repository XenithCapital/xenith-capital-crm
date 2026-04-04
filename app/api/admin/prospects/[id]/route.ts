import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { fullName, email, phone, country, sourceNote } = await request.json()

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Full name and email are required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Fetch current prospect so we can diff for the audit log
    const { data: current } = await serviceClient
      .from('prospects')
      .select('id, full_name, email, phone, country, source_note, prospect_ref')
      .eq('id', params.id)
      .single()

    if (!current) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
    }

    // If email is changing, ensure it isn't already taken by another active prospect
    if (email.toLowerCase() !== current.email.toLowerCase()) {
      const { data: conflict } = await serviceClient
        .from('prospects')
        .select('id, prospect_ref')
        .ilike('email', email)
        .neq('id', params.id)
        .not('status', 'in', '("lost","rejected")')
        .limit(1)
        .maybeSingle()

      if (conflict) {
        return NextResponse.json(
          {
            error:
              `This email is already registered to an active prospect ` +
              `(${conflict.prospect_ref ?? conflict.id}). ` +
              `Change their status to Lost or Rejected first if you want to reassign this email.`,
          },
          { status: 409 }
        )
      }
    }

    const { error: updateError } = await serviceClient
      .from('prospects')
      .update({
        full_name: fullName,
        email,
        phone: phone || null,
        country: country || null,
        source_note: sourceNote || null,
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('[admin/prospects/patch]', updateError?.message)
      return NextResponse.json({ error: 'Failed to update prospect' }, { status: 500 })
    }

    // Full before/after audit trail
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'prospect.edited',
      target_type: 'prospect',
      target_id: params.id,
      metadata: {
        prospect_ref: current.prospect_ref,
        before: {
          full_name: current.full_name,
          email: current.email,
          phone: current.phone,
          country: current.country,
          source_note: current.source_note,
        },
        after: {
          full_name: fullName,
          email,
          phone: phone || null,
          country: country || null,
          source_note: sourceNote || null,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/prospects/patch] Unexpected:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      console.error('[admin/prospects/delete]', deleteError?.message)
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
    console.error('[admin/prospects/delete] Unexpected:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
