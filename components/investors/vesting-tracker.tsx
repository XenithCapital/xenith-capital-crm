import { getVestingProgress, formatDateOnlyLondon } from '@/lib/utils'
import { ReferralRewardBadge } from '@/components/status-badge'
import type { ReferralRewardStatus } from '@/types/database'

interface VestingTrackerProps {
  vestingStartDate: string | null
  vestingEndDate: string | null
  referralRewardStatus: ReferralRewardStatus
}

export function VestingTracker({
  vestingStartDate,
  vestingEndDate,
  referralRewardStatus,
}: VestingTrackerProps) {
  const { daysElapsed, daysRemaining, percentComplete, isComplete } =
    getVestingProgress(vestingStartDate, vestingEndDate)

  const showVestingAlert = isComplete && referralRewardStatus === 'pending'

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-600">Vesting Progress</span>
          <span className="font-medium text-gray-900">{daysElapsed} / 90 days</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              isComplete ? 'bg-[#5FB548]' : 'bg-teal-500'
            }`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          {vestingStartDate && (
            <span>{formatDateOnlyLondon(vestingStartDate)}</span>
          )}
          <span className={isComplete ? 'text-green-600 font-medium' : 'text-gray-500'}>
            {isComplete ? 'Vesting complete' : `${daysRemaining} days remaining`}
          </span>
          {vestingEndDate && (
            <span>{formatDateOnlyLondon(vestingEndDate)}</span>
          )}
        </div>
      </div>

      {/* Referral reward status */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm text-gray-600">Referral Reward</span>
        <ReferralRewardBadge status={referralRewardStatus} />
      </div>

      {/* Alert if vesting complete but reward still pending */}
      {showVestingAlert && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-amber-800">
            <strong>Vesting complete — reward pending confirmation.</strong> The 90-day vesting
            period has elapsed. The referral reward of USD 500 is awaiting Xenith Capital
            confirmation.
          </p>
        </div>
      )}
    </div>
  )
}
