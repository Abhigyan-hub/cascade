import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { getCookieConsent, setCookieConsent } from '../lib/preferences'

export default function ConsentNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!getCookieConsent())
  }, [])

  function choose(value) {
    setCookieConsent(value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-[70] p-4">
      <div className="max-w-3xl mx-auto card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-lg">
        <p className="text-sm text-gray-300 flex-1">
          We use essential storage to keep you signed in, and optional storage to remember your
          email on this device.{' '}
          <Link to="/privacy" className="text-cascade-purple hover:underline">
            Privacy policy
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button type="button" className="btn-secondary py-2 text-sm" onClick={() => choose('declined')}>
            Decline
          </button>
          <button type="button" className="btn-primary py-2 text-sm" onClick={() => choose('accepted')}>
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
