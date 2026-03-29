'use client'

import { useState, useEffect } from 'react'
import { getCoolingOffTimeRemaining } from '@/lib/utils'

interface CoolingOffCountdownProps {
  coolingOffCompletedAt: string | null
  onComplete?: () => void
}

export function CoolingOffCountdown({ coolingOffCompletedAt, onComplete }: CoolingOffCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(getCoolingOffTimeRemaining(coolingOffCompletedAt))

  useEffect(() => {
    if (timeLeft.isComplete) {
      onComplete?.()
      return
    }

    const interval = setInterval(() => {
      const updated = getCoolingOffTimeRemaining(coolingOffCompletedAt)
      setTimeLeft(updated)
      if (updated.isComplete) {
        onComplete?.()
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [coolingOffCompletedAt, onComplete, timeLeft.isComplete])

  if (timeLeft.isComplete) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-green-800">Cooling-off period complete</p>
          <p className="text-sm text-green-700 mt-0.5">You may now proceed to the Education stage.</p>
        </div>
      </div>
    )
  }

  const totalSeconds = 24 * 3600
  const remainingSeconds = timeLeft.totalSecondsRemaining
  const progress = Math.max(0, Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100))

  const pad = (n: number) => n.toString().padStart(2, '0')

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-amber-900">Cooling-off period in progress</p>
          <p className="text-sm text-amber-700">
            The 24-hour regulatory cooling-off period must elapse before proceeding.
          </p>
        </div>
      </div>

      {/* Countdown timer */}
      <div className="flex items-center justify-center gap-4 py-4">
        {[
          { value: pad(timeLeft.hours), label: 'Hours' },
          { value: pad(timeLeft.minutes), label: 'Minutes' },
          { value: pad(timeLeft.seconds), label: 'Seconds' },
        ].map(({ value, label }, i) => (
          <div key={label} className="flex items-center gap-4">
            <div className="text-center">
              <div className="bg-white border border-amber-200 rounded-lg px-4 py-2 min-w-[60px]">
                <span className="text-2xl font-bold text-amber-900 tabular-nums">{value}</span>
              </div>
              <span className="text-xs text-amber-600 mt-1 block">{label}</span>
            </div>
            {i < 2 && (
              <span className="text-2xl font-bold text-amber-500 mb-4">:</span>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-amber-200 rounded-full h-2">
        <div
          className="bg-amber-500 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-amber-600 mt-2 text-center">
        {Math.floor(progress)}% elapsed
      </p>
    </div>
  )
}
