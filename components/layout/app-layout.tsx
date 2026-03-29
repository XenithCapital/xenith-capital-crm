import { Sidebar } from './sidebar'
import type { Profile } from '@/types/database'

const RISK_DISCLAIMER =
  'Trading in foreign exchange and financial instruments involves a high level of risk and may not be suitable for all investors. You may lose some or all of your invested capital. Past performance does not guarantee future results. Xenith Capital acts as Strategy Provider only; client accounts are managed by Pelican Trading (FCA Ref: 534484).'

interface AppLayoutProps {
  profile: Profile
  children: React.ReactNode
}

export function AppLayout({ profile, children }: AppLayoutProps) {
  const isIntroducer = profile.role === 'introducer'

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Sidebar profile={profile} />
      <div className="ml-64 flex flex-col min-h-screen">
        <main className="flex-1 p-6">
          {children}
        </main>
        {isIntroducer && (
          <footer className="px-6 py-4 border-t border-gray-200 bg-white">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>Risk Disclosure:</strong> {RISK_DISCLAIMER}
            </p>
          </footer>
        )}
      </div>
    </div>
  )
}
