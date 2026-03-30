import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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
    if (status !== 'active' && status !== 'dormant') {
      return NextResponse.json({ error: 'status must be active or dormant' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({ status })
      .eq('id', params.id)
      .eq('role', 'introducer')

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: status === 'dormant' ? 'introducer.made_dormant' : 'introducer.reactivated',
      target_type: 'profile',
      target_id: params.id,
      metadata: { status },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
