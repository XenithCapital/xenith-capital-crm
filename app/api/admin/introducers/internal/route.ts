import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth/permissions'

// Reserved internal ref range: XC-100 through XC-110 (11 slots)
const INTERNAL_REF_MIN = 100
const INTERNAL_REF_MAX = 110

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!isSuperAdmin(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { fullName, email } = await request.json()

    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // Check email isn't already in use
    const { data: existing } = await serviceClient
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'A profile with this email already exists' },
        { status: 409 }
      )
    }

    // Find the next available ref in the reserved range XC-100 to XC-110
    const reservedRefs = Array.from(
      { length: INTERNAL_REF_MAX - INTERNAL_REF_MIN + 1 },
      (_, i) => `XC-${INTERNAL_REF_MIN + i}`
    )

    const { data: usedRefs } = await serviceClient
      .from('profiles')
      .select('introducer_ref')
      .in('introducer_ref', reservedRefs)

    const takenSet = new Set((usedRefs ?? []).map((r) => r.introducer_ref))
    const nextRef = reservedRefs.find((ref) => !takenSet.has(ref))

    if (!nextRef) {
      return NextResponse.json(
        {
          error:
            'The internal team member reserved range (XC-100 to XC-110) is full. ' +
            'Contact your developer to extend the range.',
        },
        { status: 409 }
      )
    }

    // Create the profile — no auth account needed (FK was dropped in migration 005)
    const newId = crypto.randomUUID()

    const { data: profile, error: insertError } = await serviceClient
      .from('profiles')
      .insert({
        id: newId,
        role: 'introducer',
        full_name: fullName,
        email,
        agreement_signed: true,
        is_internal: true,
        tier: 'tier_1',
        introducer_ref: nextRef,
      })
      .select()
      .single()

    if (insertError || !profile) {
      console.error('[internal-member] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create team member' },
        { status: 500 }
      )
    }

    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'introducer.internal_created',
      target_type: 'profile',
      target_id: newId,
      metadata: {
        full_name: fullName,
        email,
        introducer_ref: nextRef,
        created_by: user.id,
      },
    })

    return NextResponse.json({ success: true, profile })
  } catch (err) {
    console.error('[internal-member] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
