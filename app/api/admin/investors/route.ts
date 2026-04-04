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
      allocations,
    } = body

    if (!introducerId || !fullName || !email) {
      return NextResponse.json(
        { error: 'introducerId, fullName, and email are required' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // Derive vesting dates from primary allocation (first with fundedAt + amount >= 10000)
    const primaryAlloc = (allocations as Array<{
      strategy: string
      fundedAmountUsd: number | null
      fundedAt: string | null
      accountNumber: string | null
      accountType: string | null
    }>)?.find((a) => a.fundedAt && a.fundedAmountUsd && a.fundedAmountUsd >= 10000)

    let vestingStartDate: string | null = null
    let vestingEndDate: string | null = null

    const primaryFundedAt = primaryAlloc?.fundedAt ?? fundedAt
    const primaryFundedAmount = primaryAlloc?.fundedAmountUsd ?? fundedAmountUsd

    if (primaryFundedAt && primaryFundedAmount && primaryFundedAmount >= 10000) {
      const start = new Date(primaryFundedAt)
      const end = new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000)
      vestingStartDate = start.toISOString()
      vestingEndDate = end.toISOString()
    }

    // Calculate total funded amount across all allocations
    const totalFunded = Array.isArray(allocations) && allocations.length > 0
      ? allocations.reduce((sum: number, a: { fundedAmountUsd?: number | null }) => sum + (a.fundedAmountUsd ?? 0), 0)
      : (fundedAmountUsd ?? null)

    const { data: investor, error: insertError } = await serviceClient
      .from('investors')
      .insert({
        prospect_id: prospectId ?? null,
        introducer_id: introducerId,
        full_name: fullName,
        email,
        phone: phone ?? null,
        vantage_account_number: vantageAccountNumber ?? null,
        strategy: strategy ?? (allocations?.[0]?.strategy ?? null),
        account_type: accountType ?? (allocations?.[0]?.accountType ?? null),
        funded_amount_usd: totalFunded ?? null,
        status: 'active',
        funded_at: fundedAt ?? (allocations?.[0]?.fundedAt ?? null),
        vesting_start_date: vestingStartDate,
        vesting_end_date: vestingEndDate,
        referral_reward_status: 'pending',
        notes: notes ?? null,
      })
      .select()
      .single()

    if (insertError || !investor) {
      console.error('[create-investor] Error:', insertError?.message)
      return NextResponse.json({ error: 'Failed to create investor' }, { status: 500 })
    }

    // Insert investor_allocations rows
    if (Array.isArray(allocations) && allocations.length > 0) {
      const allocRows = allocations
        .filter((a: { strategy?: string }) => a.strategy)
        .map((a: {
          strategy: string
          fundedAmountUsd: number | null
          fundedAt: string | null
          accountNumber: string | null
          accountType: string | null
        }) => {
          let allocVestingStart: string | null = null
          let allocVestingEnd: string | null = null
          if (a.fundedAt && a.fundedAmountUsd && a.fundedAmountUsd >= 10000) {
            const s = new Date(a.fundedAt)
            allocVestingStart = s.toISOString()
            allocVestingEnd = new Date(s.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
          }
          return {
            investor_id: investor.id,
            strategy: a.strategy,
            funded_amount_usd: a.fundedAmountUsd ?? null,
            funded_at: a.fundedAt ?? null,
            account_number: a.accountNumber ?? null,
            account_type: a.accountType ?? null,
            vesting_start_date: allocVestingStart,
            vesting_end_date: allocVestingEnd,
            referral_reward_status: 'pending',
          }
        })

      if (allocRows.length > 0) {
        const { error: allocError } = await serviceClient
          .from('investor_allocations')
          .insert(allocRows)
        if (allocError) {
          console.error('[create-investor] Allocations insert error:', allocError?.message)
          // Don't fail the whole request — investor was created, allocations can be added later
        }
      }
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
        note: `Investor record created. Account: ${vantageAccountNumber ?? allocations?.[0]?.accountNumber ?? 'pending'}`,
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
        strategy: strategy ?? allocations?.[0]?.strategy,
        funded_amount_usd: totalFunded,
        allocation_count: allocations?.length ?? 1,
        introducer_id: introducerId,
      },
    })

    return NextResponse.json({ success: true, investor })
  } catch (error) {
    console.error('[create-investor] Unexpected error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
