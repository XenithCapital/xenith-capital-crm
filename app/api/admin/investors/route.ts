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
      prospectId,
      introducerId,
      fullName,
      email,
      phone,
      vantageAccountNumber,
      strategy,
      accountType,
      fundedAmountUsd,
      fundedAt,
      notes,
    } = body

    if (!introducerId || !fullName || !email) {
      return NextResponse.json(
        { error: 'introducerId, fullName, and email are required' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    let vestingStartDate: string | null = null
    let vestingEndDate: string | null = null

    if (fundedAt && fundedAmountUsd && fundedAmountUsd >= 10000) {
      const start = new Date(fundedAt)
      const end = new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000)
      vestingStartDate = start.toISOString()
      vestingEndDate = end.toISOString()
    }

    const { data: investor, error: insertError } = await serviceClient
      .from('investors')
      .insert({
        prospect_id: prospectId ?? null,
        introducer_id: introducerId,
        full_name: fullName,
        email,
        phone: phone ?? null,
        vantage_account_number: vantageAccountNumber ?? null,
        strategy: strategy ?? null,
        account_type: accountType ?? null,
        funded_amount_usd: fundedAmountUsd ?? null,
        status: 'active',
        funded_at: fundedAt ?? null,
        vesting_start_date: vestingStartDate,
        vesting_end_date: vestingEndDate,
        referral_reward_status: 'pending',
        notes: notes ?? null,
      })
      .select()
      .single()

    if (insertError || !investor) {
      console.error('[create-investor] Error:', insertError)
      return NextResponse.json({ error: 'Failed to create investor' }, { status: 500 })
    }

    // Update prospect status to 'funded' if linked
    if (prospectId) {
      await serviceClient
        .from('prospects')
        .update({ status: 'funded' })
        .eq('id', prospectId)

      await serviceClient.from('prospect_status_history').insert({
        prospect_id: prospectId,
        changed_by: user.id,
        old_status: null,
        new_status: 'funded',
        note: `Investor record created. Account: ${vantageAccountNumber ?? 'pending'}`,
      })
    }

    // Write audit log
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'investor.created',
      target_type: 'investor',
      target_id: investor.id,
      metadata: {
        full_name: fullName,
        email,
        strategy,
        funded_amount_usd: fundedAmountUsd,
        introducer_id: introducerId,
      },
    })

    return NextResponse.json({ success: true, investor })
  } catch (error) {
    console.error('[create-investor] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
