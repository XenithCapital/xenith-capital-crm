import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { prospectSelfRegisteredEmail } from '@/lib/email/templates'
import { formatDateLondon } from '@/lib/utils'

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

    const now = new Date()
    const coolingOffEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { data: prospect, error: insertError } = await serviceClient
      .from('prospects')
      .insert({
        introducer_id: introducerId,
        full_name: fullName,
        email,
        phone,
        country,
        source_note: 'Self-registered via introducer link',
        status: 'cooling_off',
        cooling_off_started_at: now.toISOString(),
        cooling_off_completed_at: coolingOffEnd.toISOString(),
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
      new_status: 'cooling_off',
      note: 'Prospect self-registered via public introducer link.',
    })

    await serviceClient.from('audit_log').insert({
      actor_id: introducerId,
      action: 'prospect.self_registered',
      target_type: 'prospect',
      target_id: prospect.id,
      metadata: { full_name: fullName, email, country },
    })

    const endsFormatted = formatDateLondon(coolingOffEnd.toISOString())

    // Email to prospect
    await sendEmail({
      to: email,
      subject: 'Your interest in Xenith Capital — cooling-off period started',
      html: prospectSelfRegisteredEmail(fullName, introducer.full_name, endsFormatted),
    })

    // Notify introducer
    await sendEmail({
      to: introducer.email,
      subject: `New self-registered prospect — ${fullName}`,
      html: `<p>Your prospect <strong>${fullName}</strong> (${email}) has self-registered via your link. Cooling-off ends: ${endsFormatted}.</p>`,
    })

    return NextResponse.json({
      success: true,
      prospectId: prospect.id,
      coolingOffEndsAt: coolingOffEnd.toISOString(),
    })
  } catch (err) {
    console.error('[self-register] Unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
