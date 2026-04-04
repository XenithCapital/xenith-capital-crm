import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(
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

    // Allow admin or the introducer themselves
    const serviceClient = createServiceClient()

    const { data: agreement, error: fetchError } = await serviceClient
      .from('agreements')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }

    // Access check: admin or own agreement
    if (profile?.role !== 'admin' && agreement.introducer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate a signed URL (valid for 60 seconds)
    const { data: signedUrl, error: urlError } = await serviceClient.storage
      .from('introducer-agreements')
      .createSignedUrl(agreement.pdf_storage_path, 60)

    if (urlError || !signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

    return NextResponse.json({ url: signedUrl.signedUrl })
  } catch (error) {
    console.error('[download-agreement] Error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
