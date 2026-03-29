import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const category = (formData.get('category') as string) || 'general'
    const visibleToIntroducers = formData.get('visible_to_introducers') === 'true'

    if (!file || !name) {
      return NextResponse.json({ error: 'file and name are required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const ext = file.name.split('.').pop()
    const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await serviceClient.storage
      .from('documents')
      .upload(filePath, file, { contentType: file.type })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: doc, error: insertError } = await serviceClient
      .from('documents')
      .insert({
        name,
        description: description || null,
        category,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        visible_to_introducers: visibleToIntroducers,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    await serviceClient.from('audit_log').insert({
      actor_id: user.id,
      action: 'document.uploaded',
      target_type: 'document',
      target_id: doc.id,
      metadata: { name, category, file_size: file.size },
    })

    return NextResponse.json({ success: true, document: doc })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const serviceClient = createServiceClient()

    const { data: doc } = await serviceClient.from('documents').select('file_path').eq('id', id).single()
    if (doc) {
      await serviceClient.storage.from('documents').remove([doc.file_path])
    }

    await serviceClient.from('documents').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
