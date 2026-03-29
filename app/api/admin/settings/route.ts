import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
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

    const { key, value } = await request.json()
    if (!key || !value) {
      return NextResponse.json({ error: 'key and value required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { error } = await serviceClient
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: user.id })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Audit log
    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'settings.updated',
      target_type: 'app_settings',
      target_id: key,
      metadata: { key, value },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
