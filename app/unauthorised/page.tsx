import Link from 'next/link'

export default function UnauthorisedPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#002147] mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You do not have permission to access this page. If you believe this is an
          error, please contact Xenith Capital support.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-[#002147] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#003366] transition text-sm"
        >
          Return to Login
        </Link>
      </div>
    </div>
  )
}
