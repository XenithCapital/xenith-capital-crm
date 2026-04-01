import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail, ADMIN_EMAIL } from '@/lib/email/resend'
import { adminInviteEmail } from '@/lib/email/templates'
import { isSuperAdmin } from '@/lib/auth/permissions'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!isSuperAdmin(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { fullName, email } = await request.json()

    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://partners.xenithcapital.co.uk'

    // Generate invite link — same pattern as introducer invite.
    // role: 'admin' in metadata ensures the profile trigger creates them as admin.
    const { data: linkData, error: inviteError } = await serviceClient.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: {
          role: 'admin',
          full_name: fullName,
        },
        redirectTo: `${appUrl}/auth/confirm`,
      },
    })

    if (inviteError || !linkData) {
      console.error('[invite-admin]', inviteError)
      // Surface Supabase's message — most likely "User already registered"
      return NextResponse.json(
        { error: inviteError?.message ?? 'Failed to generate invitation' },
        { status: 500 }
      )
    }

    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'admin.invited',
      target_type: 'profile',
      target_id: linkData.user?.id ?? null,
      metadata: {
        email,
        full_name: fullName,
        invited_by: profile.full_name,
      },
    })

    await sendEmail({
      to: email,
      subject: 'You\'ve been added as an admin — Xenith Capital Portal',
      html: adminInviteEmail(fullName, linkData.properties.action_link),
    })

    // Also notify the inviting admin so there's a paper trail
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Admin invited: ${fullName} (${email})`,
      html: adminInviteEmail(
        `[Admin notification] ${fullName} was invited by ${profile.full_name}`,
        linkData.properties.action_link
      ),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[invite-admin] Unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
