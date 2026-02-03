import { Link, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, Clock, ChevronLeft, User } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../../lib/authContext'

const statusConfig = {
  pending: { label: 'Pending', color: 'text-cascade-gold', icon: Clock },
  accepted: { label: 'Accepted', color: 'text-green-400', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-400', icon: XCircle },
}

export default function EventRegistrations() {
  const { eventId } = useParams({ strict: false })
  const { profile } = useAuth()
  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data: ev } = await supabase
        .from('events')
        .select('id, name')
        .eq('id', eventId)
        .single()
      setEvent(ev)

      const { data: regs } = await supabase
        .from('registrations')
        .select(`
          id,
          form_data,
          status,
          status_notes,
          status_updated_at,
          created_at,
          profiles(id, full_name, email)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      setRegistrations(regs || [])
      setLoading(false)
    }
    fetch()
  }, [eventId])

  async function updateStatus(regId, status, notes = '') {
    const { error } = await supabase
      .from('registrations')
      .update({
        status,
        status_notes: notes || null,
        status_updated_by: profile?.id,
        status_updated_at: new Date().toISOString(),
      })
      .eq('id', regId)

    if (error) {
      toast.error(error.message)
      return
    }

    await supabase.from('activity_logs').insert({
      actor_id: profile?.id,
      action: `${status} registration`,
      entity_type: 'registration',
      entity_id: regId,
      metadata: { event_id: eventId },
    })

    setRegistrations((prev) =>
      prev.map((r) => (r.id === regId ? { ...r, status, status_notes: notes, status_updated_at: new Date().toISOString() } : r))
    )
    toast.success(`Registration ${status}`)
  }

  if (!event && !loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-gray-500">Event not found.</p>
        <Link to="/admin" className="text-cascade-purple hover:underline mt-4 inline-block">
          Back to admin
        </Link>
      </div>
    )
  }

  const pending = registrations.filter((r) => r.status === 'pending')
  const resolved = registrations.filter((r) => r.status !== 'pending')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-2xl font-bold text-white mb-2">Registrations for {event?.name}</h1>
        <p className="text-gray-500 mb-8">{registrations.length} total registrations</p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-5 bg-cascade-dark rounded w-1/3" />
                <div className="h-4 bg-cascade-dark rounded w-1/2 mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-cascade-gold mb-4">Pending ({pending.length})</h2>
                <div className="space-y-4">
                  {pending.map((reg) => (
                    <RegistrationRow
                      key={reg.id}
                      registration={reg}
                      onAccept={() => updateStatus(reg.id, 'accepted')}
                      onReject={() => updateStatus(reg.id, 'rejected')}
                    />
                  ))}
                </div>
              </section>
            )}
            {resolved.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-400 mb-4">Resolved ({resolved.length})</h2>
                <div className="space-y-4">
                  {resolved.map((reg) => (
                    <RegistrationRow key={reg.id} registration={reg} readOnly />
                  ))}
                </div>
              </section>
            )}
            {registrations.length === 0 && (
              <div className="card p-12 text-center text-gray-500">No registrations yet.</div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

function RegistrationRow({ registration, onAccept, onReject, readOnly }) {
  const config = statusConfig[registration.status] || statusConfig.pending
  const StatusIcon = config.icon
  const user = registration.profiles

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white font-medium">
            <User className="w-4 h-4 text-cascade-purple" />
            {user?.full_name || 'Unknown'}
          </div>
          {user?.email && <p className="text-gray-500 text-sm mt-1">{user.email}</p>}
          <p className="text-gray-400 text-sm mt-1">
            Registered {format(new Date(registration.created_at), 'MMM d, yyyy h:mm a')}
          </p>
          {Object.keys(registration.form_data || {}).length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-cascade-dark text-sm">
              {Object.entries(registration.form_data).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-gray-500">{k}:</span>
                  <span className="text-gray-300">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-2 ${config.color}`}>
            <StatusIcon className="w-4 h-4" />
            {config.label}
          </span>
          {!readOnly && (
            <div className="flex gap-2">
              <button
                onClick={onAccept}
                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={onReject}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
