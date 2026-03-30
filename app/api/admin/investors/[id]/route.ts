import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const serviceClient = createServiceClient()

    // Delete investor — cascades investor_allocations
    const { error: deleteError } = await serviceClient
      .from('investors')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { fullName, email, phone, notes, status, allocations } = body

    if (!fullName || !email) {
      return NextResponse.json({ error: 'fullName and email are required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Recalculate total funded + vesting from allocations
    const totalFunded = Array.isArray(allocations) && allocations.length > 0
      ? allocations.reduce((sum: number, a: { fundedAmountUsd?: number | null }) => sum + (a.fundedAmountUsd ?? 0), 0)
      : null

    const primaryAlloc = Array.isArray(allocations)
      ? allocations.find((a: { fundedAt?: string | null; fundedAmountUsd?: number | null }) =>
          a.fundedAt && a.fundedAmountUsd && a.fundedAmountUsd >= 10000)
      : null

    let vestingStartDate: string | null = null
    let vestingEndDate: string | null = null
    if (primaryAlloc?.fundedAt) {
      const s = new Date(primaryAlloc.fundedAt)
      vestingStartDate = s.toISOString()
      vestingEndDate = new Date(s.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
    }

    // Update investor core fields
    const { error: updateError } = await serviceClient
      .from('investors')
      .update({
        full_name: fullName,
        email,
        phone: phone ?? null,
        notes: notes ?? null,
        status: status ?? 'active',
        funded_amount_usd: totalFunded ?? null,
        strategy: allocations?.[0]?.strategy ?? null,
        account_type: allocations?.[0]?.accountType ?? null,
        vantage_account_number: allocations?.[0]?.accountNumber ?? null,
        funded_at: allocations?.[0]?.fundedAt ?? null,
        vesting_start_date: vestingStartDate,
        vesting_end_date: vestingEndDate,
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('[edit-investor] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update investor' }, { status: 500 })
    }

    // Sync allocations: upsert existing (by id), insert new, delete removed
    if (Array.isArray(allocations)) {
      // Get current allocation IDs
      const { data: existing } = await serviceClient
        .from('investor_allocations')
        .select('id')
        .eq('investor_id', params.id)

      const existingIds = new Set((existing ?? []).map((a) => a.id))
      const incomingIds = new Set(allocations.filter((a) => a.id).map((a) => a.id))

      // Delete allocations that were removed
      const toDelete = [...existingIds].filter((eid) => !incomingIds.has(eid))
      if (toDelete.length > 0) {
        await serviceClient.from('investor_allocations').delete().in('id', toDelete)
      }

      // Upsert each allocation
      for (const alloc of allocations.filter((a: { strategy?: string }) => a.strategy)) {
        let allocVestingStart: string | null = null
        let allocVestingEnd: string | null = null
        if (alloc.fundedAt && alloc.fundedAmountUsd && alloc.fundedAmountUsd >= 10000) {
          const s = new Date(alloc.fundedAt)
          allocVestingStart = s.toISOString()
          allocVestingEnd = new Date(s.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }

        const row = {
          investor_id: params.id,
          strategy: alloc.strategy,
          funded_amount_usd: alloc.fundedAmountUsd ?? null,
          funded_at: alloc.fundedAt ?? null,
          account_number: alloc.accountNumber ?? null,
          account_type: alloc.accountType ?? null,
          vesting_start_date: allocVestingStart,
          vesting_end_date: allocVestingEnd,
        }

        if (alloc.id) {
          await serviceClient.from('investor_allocations').update(row).eq('id', alloc.id)
        } else {
          await serviceClient.from('investor_allocations').insert({ ...row, referral_reward_status: 'pending' })
        }
      }
    }

    // Audit log
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'investor.updated',
      target_type: 'investor',
      target_id: params.id,
      metadata: { full_name: fullName, email, status },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[edit-investor] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
