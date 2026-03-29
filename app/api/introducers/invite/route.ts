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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.xenithcapital.co.uk'

    // Invite user via Supabase Auth
    const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          role: 'introducer',
          full_name: fullName,
        },
        redirectTo: `${appUrl}/onboarding`,
      }
    )

    if (inviteError) {
      console.error('[invite-introducer] Invite error:', inviteError)
      return NextResponse.json(
        { error: inviteError.message ?? 'Failed to send invitation' },
        { status: 500 }
      )
    }

    // Write audit log
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'introducer.invited',
      target_type: 'profile',
      target_id: inviteData?.user?.id ?? null,
      metadata: { email, full_name: fullName },
    })

    // Send branded invite email (Supabase also sends one, but ours is branded)
    const inviteUrl = `${appUrl}/login`
    await sendEmail({
      to: email,
      subject: "You've been invited to the Xenith Capital Introducer Portal",
      html: introducerInviteEmail(fullName, inviteUrl),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[invite-introducer] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
