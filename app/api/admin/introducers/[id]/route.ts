import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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

    const body = await request.json()
    const { full_name, email, phone, company_name, linkedin_url, tier } = body

    if (!full_name || !email) {
      return NextResponse.json({ error: 'full_name and email are required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { data: updated, error: updateError } = await serviceClient
      .from('profiles')
      .update({
        full_name,
        email,
        phone: phone ?? null,
        company_name: company_name ?? null,
        linkedin_url: linkedin_url ?? null,
        tier: tier ?? 'tier_1',
      })
      .eq('id', params.id)
      .eq('role', 'introducer')
      .select()
      .single()

    if (updateError || !updated) {
      return NextResponse.json({ error: updateError?.message ?? 'Update failed' }, { status: 500 })
    }

    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'introducer.updated',
      target_type: 'profile',
      target_id: params.id,
      metadata: { full_name, email, tier },
    })

    return NextResponse.json({ success: true, profile: updated })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
