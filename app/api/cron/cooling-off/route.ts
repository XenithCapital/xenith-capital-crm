import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, ADMIN_EMAIL } from '@/lib/email/resend'
import {
  coolingOffCompleteIntroducerEmail,
  coolingOffCompleteAdminEmail,
} from '@/lib/email/templates'
import { formatDateLondon } from '@/lib/utils'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.xenithcapital.co.uk'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const serviceClient = createServiceClient()
    const now = new Date().toISOString()

    // Find all prospects where cooling_off has elapsed
    const { data: expiredProspects, error: fetchError } = await serviceClient
      .from('prospects')
      .select(`
        id,
        full_name,
        email,
        cooling_off_completed_at,
        introducer_id,
        introducer:introducer_id(id, full_name, email)
      `)
      .eq('status', 'cooling_off')
      .lte('cooling_off_completed_at', now)

    if (fetchError) {
      console.error('[cron/cooling-off] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch prospects' }, { status: 500 })
    }

    if (!expiredProspects || expiredProspects.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No expired cooling-off periods found' })
    }

    let processed = 0
    const errors: string[] = []

    for (const prospect of expiredProspects) {
      try {
        const introducer = prospect.introducer as { id: string; full_name: string; email: string } | null

        // Update prospect status
        const { error: updateError } = await serviceClient
          .from('prospects')
          .update({ status: 'cooling_off_complete' })
          .eq('id', prospect.id)

        if (updateError) {
          errors.push(`Failed to update prospect ${prospect.id}: ${updateError.message}`)
          continue
        }

        // Write status history (system actor — use a system/service approach)
        await serviceClient.from('prospect_status_history').insert({
          prospect_id: prospect.id,
          changed_by: prospect.introducer_id, // system used introducer_id as actor
          old_status: 'cooling_off',
          new_status: 'cooling_off_complete',
          note: 'Cooling-off period elapsed automatically (24 hours). Status updated by system.',
        })

        // Write audit log
        await serviceClient.from('audit_log').insert({
          actor_id: prospect.introducer_id,
          action: 'prospect.cooling_off_complete',
          target_type: 'prospect',
          target_id: prospect.id,
          metadata: {
            automated: true,
            cooling_off_completed_at: prospect.cooling_off_completed_at,
          },
        })

        const completedAtFormatted = formatDateLondon(
          prospect.cooling_off_completed_at ?? now
        )

        // Email to introducer
        if (introducer?.email) {
          await sendEmail({
            to: introducer.email,
            subject: `24-hour cooling-off complete — ${prospect.full_name}`,
            html: coolingOffCompleteIntroducerEmail(
              introducer.full_name,
              prospect.full_name,
              completedAtFormatted,
              `${APP_URL}/portal/prospects/${prospect.id}`
            ),
          })
        }

        // Email to admin
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `Cooling-off complete: ${prospect.full_name} via ${introducer?.full_name ?? 'Unknown'}`,
          html: coolingOffCompleteAdminEmail(
            prospect.full_name,
            introducer?.full_name ?? 'Unknown',
            completedAtFormatted,
            `${APP_URL}/admin/prospects/${prospect.id}`
          ),
        })

        processed++
      } catch (err) {
        errors.push(`Error processing prospect ${prospect.id}: ${String(err)}`)
      }
    }

    return NextResponse.json({
      processed,
      total: expiredProspects.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[cron/cooling-off] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
