import { createServiceClient } from '@/lib/supabase/server'
import Image from 'next/image'
import ConsentForm from './consent-form'

interface Props {
  params: { token: string }
}

export default async function ProspectConsentPage({ params }: Props) {
  const serviceClient = createServiceClient()

  const { data: prospect } = await serviceClient
    .from('prospects')
    .select(`
      id, full_name, email, status,
      introducer:introducer_id(full_name)
    `)
    .eq('consent_token', params.token)
    .single()

  const introducer = prospect?.introducer as { full_name: string } | null

  // Token not found
  if (!prospect) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
        <div className="bg-[#002147] h-16 flex items-center justify-center px-8">
          <Image src="/logo.png" alt="Xenith Capital" width={160} height={44} className="object-contain" priority />
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#002147] mb-2">Link Not Found</h2>
            <p className="text-gray-500 text-sm">
              This consent link is invalid or has already been used. If you believe this is an error, please contact{' '}
              <a href="mailto:info@xenithcapital.co.uk" className="text-[#5FB548] underline">info@xenithcapital.co.uk</a>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Already consented
  if (prospect.status !== 'pending_consent') {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
        <div className="bg-[#002147] h-16 flex items-center justify-center px-8">
          <Image src="/logo.png" alt="Xenith Capital" width={160} height={44} className="object-contain" priority />
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#002147] mb-2">Already Confirmed</h2>
            <p className="text-gray-500 text-sm">
              You have already confirmed your interest. Your cooling-off period is in progress —
              please check your email for details.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-[#002147] h-16 flex items-center justify-center px-8">
        <Image src="/logo.png" alt="Xenith Capital" width={160} height={44} className="object-contain" priority />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Intro */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#002147]">Confirm Your Interest</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Referred by <strong>{introducer?.full_name ?? 'your introducer'}</strong>
          </p>
        </div>

        {/* Regulatory notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-amber-800">
            <strong>Regulatory notice:</strong> Confirming your interest will start a mandatory
            24-hour cooling-off period. During this period you are under <strong>no obligation</strong> to
            invest or take any further action. A signed record of this consent will be emailed to you.
          </p>
        </div>

        <ConsentForm
          token={params.token}
          prospectName={prospect.full_name}
          prospectEmail={prospect.email}
          introducerName={introducer?.full_name ?? 'your introducer'}
        />

        <p className="text-center text-xs text-gray-400">
          Xenith Capital — SRL Partners Ltd (Co. No. 15983046) · Strategies managed by Pelican Trading (FCA Ref: 534484)
        </p>
      </div>
    </div>
  )
}
