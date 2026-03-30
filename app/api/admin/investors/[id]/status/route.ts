import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const VALID_STATUSES = ['active', 'inactive', 'withdrawn', 'suspended'] as const
type InvestorStatus = typeof VALID_STATUSES[number]

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

    const { status } = await request.json()
    if (!VALID_STATUSES.includes(status as InvestorStatus)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { error: updateError } = await serviceClient
      .from('investors')
      .update({ status })
      .eq('id', params.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: `investor.status_changed`,
      target_type: 'investor',
      target_id: params.id,
      metadata: { status },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
