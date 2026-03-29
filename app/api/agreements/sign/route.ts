import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateAgreementPdf } from '@/lib/pdf/generate-agreement'
import { sendEmail, ADMIN_EMAIL } from '@/lib/email/resend'
import {
  agreementSignedIntroducerEmail,
  agreementSignedAdminEmail,
} from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fullNameTyped, phone, companyName, linkedinUrl } = body

    if (!fullNameTyped) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify name matches (case-insensitive)
    if (fullNameTyped.toLowerCase() !== profile.full_name.toLowerCase()) {
      return NextResponse.json(
        { error: 'Typed name does not match your registered full name' },
        { status: 400 }
      )
    }

    // Get IP address
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '0.0.0.0'

    const signedAt = new Date()

    // We need the record ID before generating PDF — create a placeholder first
    const serviceClient = createServiceClient()

    // Generate a record ID upfront
    const recordId = crypto.randomUUID()
    const timestamp = Math.floor(signedAt.getTime() / 1000)
    const pdfStoragePath = `${user.id}/agreement_${timestamp}.pdf`

    // Generate PDF
    const pdfBytes = await generateAgreementPdf({
      fullName: profile.full_name,
      signedAt,
      ipAddress,
      recordId,
      agreementVersion: 'V2_March_2026',
    })

    // Upload PDF to Supabase storage (service role to bypass RLS issues)
    const { error: uploadError } = await serviceClient.storage
      .from('introducer-agreements')
      .upload(pdfStoragePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('[sign-agreement] Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload agreement PDF' }, { status: 500 })
    }

    // Insert agreement record
    const { error: agreementError } = await serviceClient
      .from('agreements')
      .insert({
        id: recordId,
        introducer_id: user.id,
        signed_at: signedAt.toISOString(),
        ip_address: ipAddress,
        full_name_typed: fullNameTyped,
        agreement_version: 'V2_March_2026',
        pdf_storage_path: pdfStoragePath,
      })

    if (agreementError) {
      console.error('[sign-agreement] DB error:', agreementError)
      return NextResponse.json({ error: 'Failed to save agreement record' }, { status: 500 })
    }

    // Update profile: set agreement_signed + optional profile fields
    const profileUpdates: Record<string, unknown> = { agreement_signed: true }
    if (phone) profileUpdates.phone = phone
    if (companyName) profileUpdates.company_name = companyName
    if (linkedinUrl) profileUpdates.linkedin_url = linkedinUrl

    await serviceClient
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id)

    // Write audit log
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'agreement.signed',
      target_type: 'agreement',
      target_id: recordId,
      metadata: {
        agreement_version: 'V2_March_2026',
        ip_address: ipAddress,
        signed_at: signedAt.toISOString(),
      },
    })

    // Send emails
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.xenithcapital.co.uk'
    const signedAtStr = signedAt.toISOString()

    // To introducer (with PDF attached)
    await sendEmail({
      to: profile.email,
      subject: 'Your Introducer Agreement — Xenith Capital',
      html: agreementSignedIntroducerEmail(profile.full_name, signedAtStr, 'V2_March_2026'),
      attachments: [
        {
          filename: `xenith-capital-introducer-agreement-${timestamp}.pdf`,
          content: Buffer.from(pdfBytes),
        },
      ],
    })

    // To admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `New introducer signed: ${profile.full_name}`,
      html: agreementSignedAdminEmail(
        profile.full_name,
        profile.email,
        signedAtStr,
        `${appUrl}/admin/introducers/${user.id}`
      ),
    })

    return NextResponse.json({ success: true, recordId })
  } catch (error) {
    console.error('[sign-agreement] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
