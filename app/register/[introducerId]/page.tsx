import ProspectSelfRegisterForm from './self-register-form'
import { createServiceClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'

export default async function ProspectSelfRegisterPage({
  params,
}: {
  params: { introducerId: string }
}) {
  const serviceClient = createServiceClient()

  // Validate introducer exists
  const { data: introducer } = await serviceClient
    .from('profiles')
    .select('id, full_name, role, agreement_signed')
    .eq('id', params.introducerId)
    .eq('role', 'introducer')
    .eq('agreement_signed', true)
    .single()

  if (!introducer) notFound()

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Header */}
      <div className="bg-[#002147] h-20 flex items-center justify-center px-8">
        <Image src="/logo.png" alt="Xenith Capital" width={220} height={60} className="object-contain" priority />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#002147]">Register Your Interest</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Referred by <strong>{introducer.full_name}</strong>
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
            <strong>Regulatory notice:</strong> Submitting this form starts a mandatory 24-hour
            cooling-off period. You are under no obligation to proceed during or after this period.
          </div>

          <ProspectSelfRegisterForm
            introducerId={params.introducerId}
            introducerName={introducer.full_name}
          />

          <p className="text-center text-xs text-gray-400 mt-6">
            Xenith Capital — SRL Partners Ltd (Co. No. 15983046) · FCA-registered strategies via Pelican Trading (534484)
          </p>
        </div>
      </div>
    </div>
  )
}
