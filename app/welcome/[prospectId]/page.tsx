import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { STRATEGIES, STRATEGY_SERIES } from '@/lib/strategies'
import { formatCurrency } from '@/lib/utils'

export default async function ProspectWelcomePage({
  params,
}: {
  params: { prospectId: string }
}) {
  const serviceClient = createServiceClient()

  const { data: prospect } = await serviceClient
    .from('prospects')
    .select('id, full_name, status, introducer:introducer_id(full_name, email)')
    .eq('id', params.prospectId)
    .single()

  if (!prospect) notFound()

  // Fetch documents shared with introducers (also shown to prospects)
  const { data: documents } = await serviceClient
    .from('documents')
    .select('id, name, description, category, file_path, file_size')
    .eq('visible_to_introducers', true)
    .order('category', { ascending: true })

  const introducer = prospect.introducer as { full_name: string; email: string } | null

  const coolingOffDone =
    prospect.status !== 'cooling_off' && prospect.status !== null

  // Generate signed URLs for documents
  const docsWithUrls = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data } = await serviceClient.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 60 * 60) // 1 hour
      return { ...doc, signedUrl: data?.signedUrl ?? null }
    })
  )

  const docsByCategory = docsWithUrls.reduce<Record<string, typeof docsWithUrls>>(
    (acc, doc) => {
      const cat = doc.category ?? 'General'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(doc)
      return acc
    },
    {}
  )

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-[#002147] h-20 flex items-center justify-center px-8">
        <Image src="/logo.png" alt="Xenith Capital" width={220} height={60} className="object-contain" priority />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">

        {/* Welcome card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#002147] mb-2">
            Welcome, {prospect.full_name}
          </h1>
          {coolingOffDone ? (
            <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
              Your 24-hour cooling-off period is complete. You are now free to proceed
              with your Xenith Capital account opening. Your introducer
              {introducer ? <> <strong>{introducer.full_name}</strong></> : ''} will
              be in touch with next steps.
            </p>
          ) : (
            <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
              Your interest has been registered. Your cooling-off period is currently
              in progress — you will receive an email once it completes.
            </p>
          )}
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#002147] mb-6">What happens next</h2>
          <div className="space-y-5">
            {[
              {
                step: '1',
                title: 'Introducer follow-up',
                desc: `${introducer?.full_name ?? 'Your introducer'} will contact you to walk through the Xenith Capital investment strategies and answer any questions.`,
                done: coolingOffDone,
              },
              {
                step: '2',
                title: 'Account opening with Pelican Trading',
                desc: 'You will be guided through opening a trading account with Pelican Trading (FCA Ref: 534484), our regulated brokerage partner.',
                done: false,
              },
              {
                step: '3',
                title: 'Strategy allocation',
                desc: 'Once your account is open and funded, your chosen Xenith Capital strategy will be applied to your account.',
                done: false,
              },
              {
                step: '4',
                title: 'Live & monitored',
                desc: 'Your account goes live. Xenith Capital monitors performance and you receive regular updates.',
                done: false,
              },
            ].map(({ step, title, desc, done }) => (
              <div key={step} className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                  done ? 'bg-green-500 text-white' : 'bg-[#002147] text-white'
                }`}>
                  {done ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-sm leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        {Object.keys(docsByCategory).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-[#002147] mb-2">Resources & Materials</h2>
            <p className="text-sm text-gray-500 mb-6">Documents shared by Xenith Capital to help you understand our approach.</p>
            <div className="space-y-5">
              {Object.entries(docsByCategory).map(([category, docs]) => (
                <div key={category}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{category}</p>
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between py-2.5 px-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                            {doc.description && (
                              <p className="text-xs text-gray-400">{doc.description}</p>
                            )}
                          </div>
                        </div>
                        {doc.signedUrl && (
                          <a
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#5FB548] font-semibold hover:underline flex-shrink-0 ml-4"
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
          </div>
        )}

        {/* Strategies overview */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#002147] mb-2">Our Strategies</h2>
          <p className="text-sm text-gray-500 mb-6">
            Xenith Capital offers a range of systematic, quantitative strategies across different asset classes and risk profiles.
          </p>
          <div className="space-y-5">
            {STRATEGY_SERIES.map((series) => {
              const seriesStrategies = STRATEGIES.filter((s) => s.series === series.key)
              return (
                <div key={series.key}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{series.label}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {seriesStrategies.map((s) => (
                      <div key={s.code} className="border border-gray-100 rounded-lg px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#002147] bg-[#002147]/10 px-1.5 py-0.5 rounded">
                              {s.code}
                            </span>
                            <span className="text-sm font-semibold text-gray-800">{s.name}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>
                        </div>
                        {s.minInvestment && (
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-4">
                            Min {formatCurrency(s.minInvestment)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100 flex justify-center">
            <Link
              href="https://xenithcapital.co.uk/strategies"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#5FB548] hover:bg-[#4ea038] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
            >
              Full Strategy Details
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Investor dashboard sign-up */}
        <div className="bg-white rounded-2xl border-2 border-[#5FB548] p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#5FB548]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#5FB548]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#002147] mb-1">Track your account performance</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                Once your account is live, sign up to the <strong>Xenith Capital Investor Dashboard</strong> to
                monitor your portfolio performance, view strategy returns, and track your account in real time.
              </p>
              <Link
                href="https://investor.xenithcapital.co.uk/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#5FB548] hover:bg-[#4ea038] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
              >
                Sign up to investor dashboard
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-[#002147] rounded-2xl p-8 text-center">
          <h2 className="text-lg font-bold text-white mb-2">Questions?</h2>
          <p className="text-blue-200 text-sm mb-5">
            Reach out to your introducer or contact Xenith Capital directly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {introducer?.email && (
              <a
                href={`mailto:${introducer.email}`}
                className="text-sm text-white border border-white/30 hover:bg-white/10 px-4 py-2 rounded-lg transition"
              >
                Email {introducer.full_name}
              </a>
            )}
            <a
              href="mailto:info@xenithcapital.co.uk"
              className="text-sm bg-white text-[#002147] font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              info@xenithcapital.co.uk
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Xenith Capital — SRL Partners Ltd (Co. No. 15983046) · FCA-registered strategies via Pelican Trading (534484)
        </p>
      </div>
    </div>
  )
}
