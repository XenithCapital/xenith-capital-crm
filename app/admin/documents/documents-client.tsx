'use client'

import { useState, useRef } from 'react'
import { formatRelativeTime } from '@/lib/utils'

interface Doc {
  id: string
  name: string
  description: string | null
  category: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  visible_to_introducers: boolean
  uploaded_by: string | null
  created_at: string
  signedUrl: string | null
}

interface Category {
  value: string
  label: string
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mimeType: string | null) {
  if (!mimeType) return '📄'
  if (mimeType.includes('pdf')) return '📕'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📘'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📗'
  if (mimeType.includes('image')) return '🖼️'
  if (mimeType.includes('video')) return '🎬'
  return '📄'
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'legal', label: 'Legal & Compliance' },
  { value: 'marketing', label: 'Marketing Materials' },
  { value: 'training', label: 'Training & Onboarding' },
  { value: 'reports', label: 'Reports' },
  { value: 'agreements', label: 'Agreement Templates' },
]

export default function DocumentsClient({ documents: initialDocs, categories }: { documents: Doc[], categories: Category[] }) {
  const [documents, setDocuments] = useState<Doc[]>(initialDocs)
  const [filterCategory, setFilterCategory] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'general',
    visible_to_introducers: false,
  })
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = filterCategory
    ? documents.filter((d) => d.category === filterCategory)
    : documents

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) { setUploadError('Please select a file'); return }

    setUploading(true)
    setUploadError(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', uploadForm.name || file.name)
    fd.append('description', uploadForm.description)
    fd.append('category', uploadForm.category)
    fd.append('visible_to_introducers', String(uploadForm.visible_to_introducers))

    const res = await fetch('/api/admin/documents', { method: 'POST', body: fd })
    const data = await res.json()

    if (!res.ok) {
      setUploadError(data.error ?? 'Upload failed')
      setUploading(false)
      return
    }

    setDocuments((prev) => [{ ...data.document, signedUrl: null }, ...prev])
    setShowUpload(false)
    setUploadForm({ name: '', description: '', category: 'general', visible_to_introducers: false })
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
    // Refresh to get signed URL
    window.location.reload()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return
    setDeleting(id)
    await fetch('/api/admin/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    setDeleting(null)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <div className="ml-auto">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-[#5FB548] hover:bg-[#4ea038] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Document
          </button>
        </div>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-[#002147] mb-4">Upload Document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File <span className="text-red-500">*</span></label>
                <input
                  ref={fileRef}
                  type="file"
                  required
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#002147]/10 file:text-[#002147] file:font-medium hover:file:bg-[#002147]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Leave blank to use filename"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5FB548]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="visible"
                  checked={uploadForm.visible_to_introducers}
                  onChange={(e) => setUploadForm((f) => ({ ...f, visible_to_introducers: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-[#5FB548] focus:ring-[#5FB548]"
                />
                <label htmlFor="visible" className="text-sm text-gray-700 cursor-pointer">
                  Visible to introducers in their portal
                </label>
              </div>

              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-[#5FB548] hover:bg-[#4ea038] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-40 text-sm"
                >
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-gray-500 font-medium">No documents yet</p>
          <p className="text-gray-400 text-sm mt-1">Upload marketing materials, agreements, training guides and more.</p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-4 bg-[#5FB548] hover:bg-[#4ea038] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Upload your first document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((doc) => {
            const catLabel = CATEGORIES.find((c) => c.value === doc.category)?.label ?? doc.category
            return (
              <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-gray-300 transition">
                <div className="text-2xl flex-shrink-0">{fileIcon(doc.mime_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm truncate">{doc.name}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">{catLabel}</span>
                    {doc.visible_to_introducers && (
                      <span className="text-xs bg-[#5FB548]/15 text-[#5FB548] px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        Visible to introducers
                      </span>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatBytes(doc.file_size)} · {formatRelativeTime(doc.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.signedUrl && (
                    <a
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#5FB548] hover:underline font-medium px-3 py-1.5 border border-[#5FB548]/30 rounded-lg hover:bg-[#5FB548]/5 transition"
                    >
                      Download
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition disabled:opacity-40"
                  >
                    {deleting === doc.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
