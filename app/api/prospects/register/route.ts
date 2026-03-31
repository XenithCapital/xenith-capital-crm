import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import {
  prospectRegisteredEmail,
  prospectConsentRequestEmail,
} from '@/lib/email/templates'

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

    // Insert prospect with pending_consent status — cooling-off does NOT start yet
    const { data: prospect, error: insertError } = await serviceClient
      .from('prospects')
      .insert({
        introducer_id: user.id,
        full_name: fullName,
        email,
        phone,
        country,
        source_note: sourceNote,
        status: 'pending_consent',
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
      new_status: 'pending_consent',
      note: 'Prospect registered via introducer portal. Consent email sent to prospect.',
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
        status: 'pending_consent',
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://partners.xenithcapital.co.uk'
    const consentUrl = `${appUrl}/prospect/consent/${prospect.consent_token}`

    // Send consent request email to prospect
    await sendEmail({
      to: email,
      subject: 'Action Required — Confirm Your Interest in Xenith Capital',
      html: prospectConsentRequestEmail(fullName, profile.full_name, consentUrl),
    })

    // Notify introducer
    await sendEmail({
      to: profile.email,
      subject: `Prospect registered — ${fullName}`,
      html: prospectRegisteredEmail(
        profile.full_name,
        fullName,
        null,
        null,
        `${appUrl}/portal/prospects/${prospect.id}`
      ),
    })

    return NextResponse.json({ success: true, prospect })
  } catch (error) {
    console.error('[register-prospect] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
