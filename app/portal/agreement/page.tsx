import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { formatDateLondon } from '@/lib/utils'
import AgreementDownloadButton from './agreement-download-button'

export default async function PortalAgreementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agreement } = await supabase
    .from('agreements')
    .select('*')
    .eq('introducer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!agreement) {
    redirect('/onboarding')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Agreement" description="Your signed Introducer Agreement" />

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Independent Capital Introducer Agreement</h2>
            <p className="text-sm text-gray-500 mt-0.5">Xenith Capital — SRL Partners Ltd</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          {[
            { label: 'Agreement Version', value: agreement.agreement_version },
            { label: 'Signed By', value: agreement.full_name_typed },
            { label: 'Signed At', value: formatDateLondon(agreement.signed_at) },
            { label: 'Agreement ID', value: agreement.id },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-900 font-mono text-xs max-w-xs truncate text-right">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <AgreementDownloadButton agreementId={agreement.id} />
        </div>

        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
          This is a legally binding document. Please retain a copy for your records. If you have
          questions about the terms, contact{' '}
          <a href="mailto:info@xenithcapital.co.uk" className="text-[#5FB548] hover:underline">
            info@xenithcapital.co.uk
          </a>.
        </p>
      </div>
    </div>
  )
}
