import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail, ADMIN_EMAIL } from '@/lib/email/resend'
import { introducerInviteEmail } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, fullName } = body

    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://partners.xenithcapital.co.uk'

    // Generate the invite link ourselves so we can embed it in our branded email.
    // Using generateLink does NOT trigger Supabase's default invite email — we send ours via Resend.
    const { data: linkData, error: inviteError } = await serviceClient.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: {
          role: 'introducer',
          full_name: fullName,
        },
        redirectTo: `${appUrl}/auth/confirm`,
      },
    })

    if (inviteError || !linkData) {
      console.error('[invite-introducer] Invite error:', inviteError)
      return NextResponse.json(
        { error: inviteError?.message ?? 'Failed to generate invitation' },
        { status: 500 }
      )
    }

    // Write audit log
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'introducer.invited',
      target_type: 'profile',
      target_id: linkData.user?.id ?? null,
      metadata: { email, full_name: fullName },
    })

    // Send our branded invite email with the real token link
    const inviteUrl = linkData.properties.action_link
    await sendEmail({
      to: email,
      subject: "You've been invited to the Xenith Capital Introducer Portal",
      html: introducerInviteEmail(fullName, inviteUrl),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[invite-introducer] Unexpected error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
