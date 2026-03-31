import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateConsentPdf } from '@/lib/pdf/generate-consent'
import { sendEmail } from '@/lib/email/resend'
import { prospectConsentConfirmedEmail } from '@/lib/email/templates'
import { formatDateLondon } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { token, fullNameTyped } = await request.json()

    if (!token || !fullNameTyped) {
      return NextResponse.json({ error: 'Token and name are required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Look up prospect by consent token
    const { data: prospect, error: fetchError } = await serviceClient
      .from('prospects')
      .select(`
        id, full_name, email, status, consent_token,
        introducer_id,
        introducer:introducer_id(id, full_name, email)
      `)
      .eq('consent_token', token)
      .single()

    if (fetchError || !prospect) {
      return NextResponse.json({ error: 'This consent link is invalid.' }, { status: 404 })
    }

    if (prospect.status !== 'pending_consent') {
      return NextResponse.json(
        { error: 'You have already confirmed your interest. Your cooling-off period is in progress.' },
        { status: 409 }
      )
    }

    // Verify typed name matches registered name (case-insensitive)
    if (fullNameTyped.trim().toLowerCase() !== prospect.full_name.toLowerCase()) {
      return NextResponse.json(
        { error: 'The name you entered does not match your registered name.' },
        { status: 400 }
      )
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '0.0.0.0'

    const now = new Date()
    const coolingOffEnds = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const introducer = prospect.introducer as { id: string; full_name: string; email: string } | null

    // Generate consent PDF
    let pdfBytes: Uint8Array
    try {
      pdfBytes = await generateConsentPdf({
        prospectName:   prospect.full_name,
        introducerName: introducer?.full_name ?? 'Xenith Capital',
        signedAt:       now,
        ipAddress,
        recordId:       prospect.id,
      })
    } catch (pdfErr) {
      console.error('[prospect/consent] PDF error:', pdfErr)
      return NextResponse.json({ error: 'Failed to generate consent record' }, { status: 500 })
    }

    // Upload PDF to storage
    const pdfPath = `${prospect.id}/consent_${Math.floor(now.getTime() / 1000)}.pdf`
    const { error: uploadError } = await serviceClient.storage
      .from('prospect-consents')
      .upload(pdfPath, pdfBytes, { contentType: 'application/pdf', upsert: false })

    if (uploadError) {
      console.error('[prospect/consent] Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to store consent record' }, { status: 500 })
    }

    // Update prospect: start cooling-off, record consent details
    const { error: updateError } = await serviceClient
      .from('prospects')
      .update({
        status:                  'cooling_off',
        cooling_off_started_at:  now.toISOString(),
        cooling_off_completed_at: coolingOffEnds.toISOString(),
        consent_signed_at:       now.toISOString(),
        consent_ip_address:      ipAddress,
        consent_pdf_path:        pdfPath,
      })
      .eq('id', prospect.id)

    if (updateError) {
      console.error('[prospect/consent] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to start cooling-off period' }, { status: 500 })
    }

    // Status history
    await serviceClient.from('prospect_status_history').insert({
      prospect_id: prospect.id,
      changed_by:  prospect.introducer_id,
      old_status:  'pending_consent',
      new_status:  'cooling_off',
      note:        'Prospect confirmed consent via emailed link. 24-hour cooling-off period started.',
    })

    // Audit log
    await serviceClient.from('audit_log').insert({
      actor_id:    prospect.introducer_id,
      action:      'prospect.consent_confirmed',
      target_type: 'prospect',
      target_id:   prospect.id,
      metadata: {
        ip_address:    ipAddress,
        consent_at:    now.toISOString(),
        cooling_off_ends: coolingOffEnds.toISOString(),
      },
    })

    const coolingOffEndsFormatted = formatDateLondon(coolingOffEnds.toISOString())

    // Email to prospect with PDF attached
    await sendEmail({
      to:      prospect.email,
      subject: 'Cooling-Off Period Started — Xenith Capital',
      html:    prospectConsentConfirmedEmail(
        prospect.full_name,
        introducer?.full_name ?? 'Xenith Capital',
        coolingOffEndsFormatted
      ),
      attachments: [{
        filename: `xenith-capital-consent-${Math.floor(now.getTime() / 1000)}.pdf`,
        content:  Buffer.from(pdfBytes),
      }],
    })

    return NextResponse.json({
      success:         true,
      coolingOffEndsAt: coolingOffEnds.toISOString(),
    })
  } catch (err) {
    console.error('[prospect/consent] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
