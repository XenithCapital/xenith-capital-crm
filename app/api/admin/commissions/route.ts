import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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
    const {
      investorId,
      periodLabel,
      amountGbp,
      performanceFeeGbp,
      commissionRate,
      notes,
    } = body as {
      investorId: string
      periodLabel: string
      amountGbp: number
      performanceFeeGbp?: number | null
      commissionRate?: number | null
      notes?: string | null
    }

    if (!investorId || !periodLabel || !amountGbp) {
      return NextResponse.json({ error: 'investorId, periodLabel and amountGbp are required' }, { status: 400 })
    }

    if (amountGbp <= 0) {
      return NextResponse.json({ error: 'amountGbp must be greater than zero' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Resolve introducer_id from investor record
    const { data: investor, error: invErr } = await serviceClient
      .from('investors')
      .select('id, introducer_id, full_name')
      .eq('id', investorId)
      .single()

    if (invErr || !investor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
    }

    const { data: commission, error: insertErr } = await serviceClient
      .from('commissions')
      .insert({
        investor_id: investorId,
        introducer_id: investor.introducer_id,
        period_label: periodLabel.trim(),
        amount_gbp: amountGbp,
        performance_fee_gbp: performanceFeeGbp ?? null,
        commission_rate: commissionRate ?? null,
        notes: notes?.trim() || null,
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single()

    if (insertErr || !commission) {
      console.error('[commissions/POST] insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to create commission record' }, { status: 500 })
    }

    // Audit log
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'commission.created',
      target_type: 'commission',
      target_id: commission.id,
      metadata: {
        investor_id: investorId,
        investor_name: investor.full_name,
        introducer_id: investor.introducer_id,
        period_label: periodLabel,
        amount_gbp: amountGbp,
      },
    })

    return NextResponse.json({ success: true, commission })
  } catch (error) {
    console.error('[commissions/POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
