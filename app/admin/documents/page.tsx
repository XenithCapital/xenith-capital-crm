import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import DocumentsClient from './documents-client'

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'legal', label: 'Legal & Compliance' },
  { value: 'marketing', label: 'Marketing Materials' },
  { value: 'training', label: 'Training & Onboarding' },
  { value: 'reports', label: 'Reports' },
  { value: 'agreements', label: 'Agreement Templates' },
]

export default async function AdminDocumentsPage() {
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  // Get signed URLs for each document
  const serviceClient = createServiceClient()
  const docsWithUrls = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data } = await serviceClient.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 300) // 5 min signed URL
      return { ...doc, signedUrl: data?.signedUrl ?? null }
    })
  )

  return (
    <div>
      <PageHeader
        title="Document Library"
        description={`${documents?.length ?? 0} document${(documents?.length ?? 0) !== 1 ? 's' : ''} stored`}
      />
      <DocumentsClient documents={docsWithUrls} categories={CATEGORIES} />
    </div>
  )
}
