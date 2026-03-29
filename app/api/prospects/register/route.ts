import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail, ADMIN_EMAIL } from '@/lib/email/resend'
import {
  prospectRegisteredEmail,
} from '@/lib/email/templates'
import { formatDateLondon } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'introducer' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { fullName, email, phone, country, sourceNote } = body

    if (!fullName || !email || !phone || !country || !sourceNote) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()
    const now = new Date()
    const coolingOffCompleted = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Insert prospect (trigger will set cooling_off timestamps)
    const { data: prospect, error: insertError } = await serviceClient
      .from('prospects')
      .insert({
        introducer_id: user.id,
        full_name: fullName,
        email,
        phone,
        country,
        source_note: sourceNote,
        status: 'cooling_off',
      })
      .select()
      .single()

    if (insertError || !prospect) {
      console.error('[register-prospect] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to register prospect' }, { status: 500 })
    }

    // Write initial status history
    await serviceClient.from('prospect_status_history').insert({
      prospect_id: prospect.id,
      changed_by: user.id,
      old_status: null,
      new_status: 'cooling_off',
      note: 'Prospect registered via portal. Cooling-off period started automatically.',
    })

    // Write audit log
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'prospect.created',
      target_type: 'prospect',
      target_id: prospect.id,
      metadata: {
        full_name: fullName,
        email,
        country,
        cooling_off_started: prospect.cooling_off_started_at,
        cooling_off_completes: prospect.cooling_off_completed_at,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.xenithcapital.co.uk'
    const startedAt = formatDateLondon(prospect.cooling_off_started_at ?? now.toISOString())
    const completedAt = formatDateLondon(prospect.cooling_off_completed_at ?? coolingOffCompleted.toISOString())

    // Send confirmation email to introducer
    await sendEmail({
      to: profile.email,
      subject: `Prospect registered — ${fullName}`,
      html: prospectRegisteredEmail(
        profile.full_name,
        fullName,
        startedAt,
        completedAt,
        `${appUrl}/portal/prospects/${prospect.id}`
      ),
    })

    return NextResponse.json({ success: true, prospect })
  } catch (error) {
    console.error('[register-prospect] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
