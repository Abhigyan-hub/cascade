import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { Calendar, CheckCircle, XCircle, Clock, IndianRupee } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../../lib/authContext'

const statusConfig = {
  pending: { label: 'Pending', color: 'text-cascade-gold', icon: Clock },
  accepted: { label: 'Accepted', color: 'text-green-400', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-400', icon: XCircle },
}

export default function ClientDashboard() {
  const { profile } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return

    async function fetchRegistrations() {
      const { data } = await supabase
        .from('registrations')
        .select(`
          id,
          status,
          created_at,
          events(id, name, event_date, fee_amount),
          payments(status, amount_paise)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      setRegistrations(data || [])
      setLoading(false)
    }
    fetchRegistrations()
  }, [profile?.id])

  const upcoming = registrations.filter(
    (r) => r.events && new Date(r.events.event_date) >= new Date()
  )
  const completed = registrations.filter(
    (r) => r.events && new Date(r.events.event_date) < new Date()
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
        <p className="text-gray-500">Welcome back, {profile?.full_name}</p>

        {loading ? (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-5 bg-cascade-dark rounded w-1/3 mb-4" />
                <div className="h-4 bg-cascade-dark rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cascade-purple" />
                Upcoming Events ({upcoming.length})
              </h2>
              {upcoming.length === 0 ? (
                <div className="card p-8 text-center text-gray-500">
                  No upcoming registrations
                </div>
              ) : (
                <div className="space-y-4">
                  {upcoming.map((reg) => (
                    <RegistrationCard key={reg.id} registration={reg} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Completed Events ({completed.length})</h2>
              {completed.length === 0 ? (
                <div className="card p-8 text-center text-gray-500">
                  No past registrations
                </div>
              ) : (
                <div className="space-y-4">
                  {completed.map((reg) => (
                    <RegistrationCard key={reg.id} registration={reg} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function RegistrationCard({ registration }) {
  const event = registration.events
  const config = statusConfig[registration.status] || statusConfig.pending
  const StatusIcon = config.icon

  if (!event) return null

  const feeDisplay = event.fee_amount === 0 ? 'Free' : `₹${(event.fee_amount / 100).toLocaleString('en-IN')}`
  const payment = registration.payments?.[0]
  const paymentOk = !event.fee_amount || (payment?.status === 'captured')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <Link
          to="/events/$eventId"
          params={{ eventId: event.id }}
          className="font-semibold text-white hover:text-cascade-purple-light transition-colors"
        >
          {event.name}
        </Link>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          {feeDisplay}
          {event.fee_amount > 0 && payment && (
            <span className={paymentOk ? ' text-green-400 ml-2' : ' text-cascade-gold ml-2'}>
              • {paymentOk ? 'Paid' : 'Payment pending'}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`flex items-center gap-2 ${config.color}`}>
          <StatusIcon className="w-4 h-4" />
          {config.label}
        </span>
      </div>
    </motion.div>
  )
}
