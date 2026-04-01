import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { commissionInvoiceRequestEmail, commissionPaidEmail } from '@/lib/email/templates'
import type { CommissionStatus } from '@/types/database'

type TransitionAction = 'request_invoice' | 'invoice_received' | 'mark_paid' | 'cancel'

const NEXT_STATUS: Record<TransitionAction, CommissionStatus> = {
  request_invoice: 'invoice_requested',
  invoice_received: 'invoice_received',
  mark_paid: 'paid',
  cancel: 'cancelled',
}

// Which source statuses allow each action
const VALID_FROM: Record<TransitionAction, CommissionStatus[]> = {
  request_invoice: ['pending'],
  invoice_received: ['invoice_requested'],
  mark_paid: ['invoice_received'],
  cancel: ['pending', 'invoice_requested', 'invoice_received'],
}

export async function PATCH(
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

    const { action } = (await request.json()) as { action: TransitionAction }

    if (!action || !NEXT_STATUS[action]) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const commissionId = params.id

    // Fetch commission + investor + introducer
    const { data: commission, error: fetchErr } = await serviceClient
      .from('commissions')
      .select(`
        *,
        investor:investor_id (id, full_name),
        introducer:introducer_id (id, full_name, email, is_internal)
      `)
      .eq('id', commissionId)
      .single()

    if (fetchErr || !commission) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 })
    }

    const currentStatus = commission.status as CommissionStatus
    if (!VALID_FROM[action].includes(currentStatus)) {
      return NextResponse.json({
        error: `Cannot perform "${action}" on a commission with status "${currentStatus}"`,
      }, { status: 422 })
    }

    const newStatus = NEXT_STATUS[action]
    const now = new Date().toISOString()

    // Build timestamp fields
    const timestamps: Record<string, string | null> = {}
    if (action === 'request_invoice') timestamps.invoice_requested_at = now
    if (action === 'invoice_received') timestamps.invoice_received_at = now
    if (action === 'mark_paid') timestamps.paid_at = now

    const { error: updateErr } = await serviceClient
      .from('commissions')
      .update({ status: newStatus, ...timestamps })
      .eq('id', commissionId)

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 })
    }

    // Audit
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: `commission.${action}`,
      target_type: 'commission',
      target_id: commissionId,
      metadata: {
        old_status: currentStatus,
        new_status: newStatus,
        investor_id: commission.investor_id,
        introducer_id: commission.introducer_id,
        period_label: commission.period_label,
        amount_gbp: commission.amount_gbp,
      },
    })

    // Send emails
    const investor = commission.investor as { id: string; full_name: string } | null
    const introducer = commission.introducer as {
      id: string; full_name: string; email: string; is_internal: boolean
    } | null

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://partners.xenithcapital.co.uk'
    const portalEarningsUrl = `${appUrl}/portal/earnings`

    if (introducer && !introducer.is_internal) {
      if (action === 'request_invoice') {
        await sendEmail({
          to: introducer.email,
          subject: `Invoice Request — Commission for ${investor?.full_name ?? 'your investor'} (${commission.period_label})`,
          html: commissionInvoiceRequestEmail(
            introducer.full_name,
            investor?.full_name ?? 'your investor account',
            commission.period_label,
            commission.amount_gbp,
            commission.notes ?? null,
            portalEarningsUrl
          ),
        })
      }

      if (action === 'mark_paid') {
        await sendEmail({
          to: introducer.email,
          subject: `Commission Paid — ${investor?.full_name ?? 'your investor'} (${commission.period_label})`,
          html: commissionPaidEmail(
            introducer.full_name,
            investor?.full_name ?? 'your investor account',
            commission.period_label,
            commission.amount_gbp,
            portalEarningsUrl
          ),
        })
      }
    }

    return NextResponse.json({ success: true, newStatus })
  } catch (error) {
    console.error('[commissions/PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
