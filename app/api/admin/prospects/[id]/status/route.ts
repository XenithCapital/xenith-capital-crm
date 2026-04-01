import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { prospectStatusUpdateEmail } from '@/lib/email/templates'
import type { ProspectStatus } from '@/types/database'

// Human-readable labels — mirrors the StatusUpdateForm labels
const STATUS_LABELS: Record<ProspectStatus, string> = {
  pending_consent:      'Pending Consent',
  registered:           'Registered',
  cooling_off:          'Cooling-Off',
  cooling_off_complete: 'Cooling-Off Complete',
  education_sent:       'Onboarding Pack Issued',
  handoff_pending:      'Introducer to Xenith Handoff',
  handed_off:           'Handed Off',
  onboarding:           'Pelican Onboarding',
  funded:               'Funded',
  active:               'Compliant & Active',
  stalled:              'Stalled',
  lost:                 'Lost',
  rejected:             'Rejected',
}

export async function POST(
  request: NextRequest,
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

    const body = await request.json()
    const { newStatus, note } = body as { newStatus: ProspectStatus; note: string }

    if (!newStatus) {
      return NextResponse.json({ error: 'newStatus is required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const prospectId = params.id

    // Fetch prospect + introducer in one query
    const { data: prospect, error: fetchError } = await serviceClient
      .from('prospects')
      .select(`
        status,
        full_name,
        prospect_ref,
        introducer:introducer_id (
          id,
          full_name,
          email,
          is_internal
        )
      `)
      .eq('id', prospectId)
      .single()

    if (fetchError || !prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
    }

    const oldStatus = prospect.status as ProspectStatus
    const introducer = prospect.introducer as {
      id: string
      full_name: string
      email: string
      is_internal: boolean
    } | null

    // Update status
    const { error: updateError } = await serviceClient
      .from('prospects')
      .update({ status: newStatus })
      .eq('id', prospectId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    // Write status history
    await serviceClient.from('prospect_status_history').insert({
      prospect_id: prospectId,
      changed_by: user.id,
      old_status: oldStatus,
      new_status: newStatus,
      note: note ?? null,
    })

    // Write audit log
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'prospect.status_updated',
      target_type: 'prospect',
      target_id: prospectId,
      metadata: {
        old_status: oldStatus,
        new_status: newStatus,
        note,
        prospect_ref: prospect.prospect_ref,
      },
    })

    // Notify the introducer — skip internal team members (they share the admin login)
    if (introducer && !introducer.is_internal) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://partners.xenithcapital.co.uk'
      const portalUrl = `${appUrl}/portal/prospects/${prospectId}`

      await sendEmail({
        to: introducer.email,
        subject: `Update on ${prospect.full_name}${prospect.prospect_ref ? ` (${prospect.prospect_ref})` : ''} — ${STATUS_LABELS[newStatus]}`,
        html: prospectStatusUpdateEmail(
          introducer.full_name,
          prospect.full_name,
          prospect.prospect_ref ?? null,
          STATUS_LABELS[oldStatus] ?? oldStatus,
          STATUS_LABELS[newStatus] ?? newStatus,
          note || null,
          portalUrl
        ),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[update-prospect-status] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
