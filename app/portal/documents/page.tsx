import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { formatRelativeTime } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  legal: 'Legal & Compliance',
  marketing: 'Marketing Materials',
  training: 'Training & Onboarding',
  reports: 'Reports',
  agreements: 'Agreement Templates',
}

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mime: string | null) {
  if (!mime) return '📄'
  if (mime.includes('pdf')) return '📕'
  if (mime.includes('word') || mime.includes('document')) return '📘'
  if (mime.includes('sheet') || mime.includes('excel')) return '📗'
  if (mime.includes('image')) return '🖼️'
  return '📄'
}

export default async function PortalDocumentsPage() {
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('visible_to_introducers', true)
    .order('created_at', { ascending: false })

  const serviceClient = createServiceClient()
  const docsWithUrls = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data } = await serviceClient.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 300)
      return { ...doc, signedUrl: data?.signedUrl ?? null }
    })
  )

  // Group by category
  const grouped: Record<string, typeof docsWithUrls> = {}
  for (const doc of docsWithUrls) {
    if (!grouped[doc.category]) grouped[doc.category] = []
    grouped[doc.category].push(doc)
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Resources and materials shared by Xenith Capital"
      />

      {docsWithUrls.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-gray-500 font-medium">No documents available yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Xenith Capital will share resources here for your use.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, docs]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {CATEGORY_LABELS[category] ?? category}
                </h2>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-gray-300 transition"
                  >
                    <div className="text-2xl flex-shrink-0">{fileIcon(doc.mime_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{doc.name}</p>
                      {doc.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatBytes(doc.file_size)}{doc.file_size ? ' · ' : ''}{formatRelativeTime(doc.created_at)}
                      </p>
                    </div>
                    {doc.signedUrl && (
                      <a
                        href={doc.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-xs text-[#5FB548] hover:underline font-medium px-3 py-1.5 border border-[#5FB548]/30 rounded-lg hover:bg-[#5FB548]/5 transition"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
