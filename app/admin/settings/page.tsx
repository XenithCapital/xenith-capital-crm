import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import SettingsClient from './settings-client'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const [
    { data: adminUsers },
    { data: agreementSetting },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true }),
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'agreement_version')
      .single(),
  ])

  const currentAgreementVersion = agreementSetting?.value ?? 'V2_March_2026'

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Portal configuration and admin management" />

      <SettingsClient
        agreementVersion={currentAgreementVersion}
        adminUsers={adminUsers ?? []}
      />

      {/* Email configuration (static) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-[#002147] mb-3">Email Configuration</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Sender</span>
            <span className="font-mono text-gray-900">noreply@xenithcapital.co.uk</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Reply-To</span>
            <span className="font-mono text-gray-900">info@xenithcapital.co.uk</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Admin Notifications</span>
            <span className="font-mono text-gray-900">info@xenithcapital.co.uk</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email Provider</span>
            <span className="text-gray-900">Resend</span>
          </div>
        </div>
      </div>

      {/* Cron job status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-[#002147] mb-3">Automated Jobs</h2>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">Cooling-Off Status Cron</p>
            <p className="text-xs text-gray-500">
              Runs every 15 minutes via Vercel Cron ·{' '}
              <code className="bg-gray-100 px-1 rounded">/api/cron/cooling-off</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
