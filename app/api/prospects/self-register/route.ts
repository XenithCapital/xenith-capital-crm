import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import {
  prospectConsentRequestEmail,
  prospectSelfRegisteredEmail,
} from '@/lib/email/templates'

// Public endpoint — no auth required. Prospect self-registers via introducer link.
export async function POST(request: NextRequest) {
  try {
    const { introducerId, fullName, email, phone, country } = await request.json()

    if (!introducerId || !fullName || !email || !phone || !country) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Validate introducer
    const { data: introducer } = await serviceClient
      .from('profiles')
      .select('id, full_name, email, role, agreement_signed')
      .eq('id', introducerId)
      .eq('role', 'introducer')
      .eq('agreement_signed', true)
      .single()

    if (!introducer) {
      return NextResponse.json({ error: 'Invalid registration link' }, { status: 404 })
    }

    // ── Duplicate detection ─────────────────────────────────────────────────
    const { data: existingByEmail } = await serviceClient
      .from('prospects')
      .select('id, prospect_ref, introducer_id, status')
      .ilike('email', email)
      .not('status', 'in', '("lost","rejected")')
      .limit(1)
      .maybeSingle()

    if (existingByEmail) {
      await serviceClient.from('audit_log').insert({
        actor_id: introducerId,
        action: 'prospect.duplicate_blocked',
        target_type: 'prospect',
        target_id: existingByEmail.id,
        metadata: {
          attempted_by: introducerId,
          attempted_email: email,
          attempted_name: fullName,
          match_field: 'email',
          source: 'self_register',
          existing_ref: existingByEmail.prospect_ref ?? null,
          existing_status: existingByEmail.status,
          existing_introducer_id: existingByEmail.introducer_id,
        },
      })
      return NextResponse.json(
        {
          error:
            'This contact is already known to us. If you believe this is an error, please contact the Xenith Capital team.',
          code: 'DUPLICATE_PROSPECT',
        },
        { status: 409 }
      )
    }

    if (phone) {
      const { data: existingByPhone } = await serviceClient
        .from('prospects')
        .select('id, prospect_ref, introducer_id, status')
        .eq('phone', phone)
        .not('status', 'in', '("lost","rejected")')
        .limit(1)
        .maybeSingle()

      if (existingByPhone) {
        await serviceClient.from('audit_log').insert({
          actor_id: introducerId,
          action: 'prospect.duplicate_blocked',
          target_type: 'prospect',
          target_id: existingByPhone.id,
          metadata: {
            attempted_by: introducerId,
            attempted_email: email,
            attempted_name: fullName,
            match_field: 'phone',
            source: 'self_register',
            existing_ref: existingByPhone.prospect_ref ?? null,
            existing_status: existingByPhone.status,
            existing_introducer_id: existingByPhone.introducer_id,
          },
        })
        return NextResponse.json(
          {
            error:
              'This contact is already known to us. If you believe this is an error, please contact the Xenith Capital team.',
            code: 'DUPLICATE_PROSPECT',
          },
          { status: 409 }
        )
      }
    }
    // ───────────────────────────────────────────────────────────────────────

    // Insert prospect with pending_consent status — cooling-off does NOT start yet
    const { data: prospect, error: insertError } = await serviceClient
      .from('prospects')
      .insert({
        introducer_id: introducerId,
        full_name: fullName,
        email,
        phone,
        country,
        source_note: 'Self-registered via introducer link',
        status: 'pending_consent',
      })
      .select()
      .single()

    if (insertError || !prospect) {
      console.error('[self-register]', insertError)
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }

    await serviceClient.from('prospect_status_history').insert({
      prospect_id: prospect.id,
      changed_by: introducerId,
      old_status: null,
      new_status: 'pending_consent',
      note: 'Prospect self-registered via public introducer link. Consent email sent.',
    })

    await serviceClient.from('audit_log').insert({
      actor_id: introducerId,
      action: 'prospect.self_registered',
      target_type: 'prospect',
      target_id: prospect.id,
      metadata: { full_name: fullName, email, country, status: 'pending_consent' },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://partners.xenithcapital.co.uk'
    const consentUrl = `${appUrl}/prospect/consent/${prospect.consent_token}`

    // Send consent request email to prospect
    await sendEmail({
      to: email,
      subject: 'Action Required — Confirm Your Interest in Xenith Capital',
      html: prospectConsentRequestEmail(fullName, introducer.full_name, consentUrl),
    })

    // Notify introducer
    await sendEmail({
      to: introducer.email,
      subject: `New prospect registered — ${fullName}`,
      html: prospectSelfRegisteredEmail(fullName, introducer.full_name, null),
    })

    return NextResponse.json({
      success: true,
      prospectId: prospect.id,
    })
  } catch (err) {
    console.error('[self-register] Unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
