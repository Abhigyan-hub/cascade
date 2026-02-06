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
  // Bind params to this exact route to avoid occasional undefined eventId
  const { eventId } = useParams({ from: '/admin/events/$eventId/registrations' })
  const { profile } = useAuth()
  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyUser, setHistoryUser] = useState(null)
  const [historyRegs, setHistoryRegs] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(new Set())

  useEffect(() => {
    async function fetch() {
      try {
        console.log('Fetching registrations for event:', eventId)
        
        const { data: ev, error: evError } = await supabase
          .from('events')
          .select('id, name')
          .eq('id', eventId)
          .single()
        
        if (evError) {
          console.error('Error fetching event:', evError)
          toast.error('Failed to load event details')
        } else {
          console.log('Event loaded:', ev?.name)
          setEvent(ev)
        }

        const { data: regs, error: regsError } = await supabase
          .from('registrations')
          .select(`
            id,
            form_data,
            status,
            status_notes,
            status_updated_at,
            created_at,
            profiles!user_id(id, full_name, email)
          `)
          .eq('event_id', eventId)
          .order('created_at', { ascending: false })

        if (regsError) {
          console.error('Error fetching registrations:', regsError)
          console.error('Error details:', {
            message: regsError.message,
            code: regsError.code,
            details: regsError.details,
            hint: regsError.hint
          })
          toast.error(`Failed to load registrations: ${regsError.message}`)
          setRegistrations([])
        } else {
          console.log('Registrations loaded:', regs?.length || 0)
          setRegistrations(regs || [])
          if (regs && regs.length > 0) {
            console.log('Sample registration:', regs[0])
          }
        }
      } catch (err) {
        console.error('Exception in EventRegistrations fetch:', err)
        toast.error('An unexpected error occurred')
        setRegistrations([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [eventId])

  async function openHistory(user) {
    if (!user?.id) return
    setHistoryOpen(true)
    setHistoryUser(user)
    setHistoryLoading(true)
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          status,
          created_at,
          events(id, name, event_date, fee_amount)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user registration history:', error)
        setHistoryRegs([])
      } else {
        setHistoryRegs(data || [])
      }
    } catch (err) {
      console.error('Exception fetching user registration history:', err)
      setHistoryRegs([])
    } finally {
      setHistoryLoading(false)
    }
  }

  async function updateStatus(regId, status, notes = '') {
    if (!regId || !status) return
    
    // Prevent duplicate clicks - check if already updating
    if (updatingStatus.has(regId)) {
      console.log('Status update already in progress for:', regId)
      return
    }
    
    // Mark as updating
    setUpdatingStatus((prev) => new Set(prev).add(regId))
    
    try {
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
    } catch (err) {
      console.error('Error updating status:', err)
      toast.error('Failed to update status')
    } finally {
      // Remove from updating set
      setUpdatingStatus((prev) => {
        const next = new Set(prev)
        next.delete(regId)
        return next
      })
    }
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
                      onViewHistory={openHistory}
                      updatingStatus={updatingStatus}
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
                    <RegistrationRow
                      key={reg.id}
                      registration={reg}
                      readOnly
                      onViewHistory={openHistory}
                      updatingStatus={updatingStatus}
                    />
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

      {historyOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-cascade-border">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  History for {historyUser?.full_name || 'Participant'}
                </h2>
                {historyUser?.email && (
                  <p className="text-gray-500 text-sm">{historyUser.email}</p>
                )}
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              {historyLoading ? (
                <p className="text-gray-500 text-sm">Loading history…</p>
              ) : historyRegs.length === 0 ? (
                <p className="text-gray-500 text-sm">No other registrations found.</p>
              ) : (
                historyRegs.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-white">
                        {r.events?.name || 'Event'}
                      </p>
                      {r.events?.event_date && (
                        <p className="text-gray-500">
                          {format(new Date(r.events.event_date), 'MMM d, yyyy • h:mm a')}
                        </p>
                      )}
                    </div>
                    <span className="text-gray-400 capitalize">{r.status}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function RegistrationRow({ registration, onAccept, onReject, readOnly, onViewHistory, updatingStatus = new Set() }) {
  const config = statusConfig[registration.status] || statusConfig.pending
  const StatusIcon = config.icon
  const user = registration.profiles
  const isUpdating = updatingStatus.has(registration.id)

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
          <div className="flex gap-2">
            {!readOnly && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!isUpdating) onAccept()
                  }}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Accept'}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!isUpdating) onReject()
                  }}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Reject'}
                </button>
              </>
            )}
            {onViewHistory && user && (
              <button
                onClick={() => onViewHistory(user)}
                className="px-4 py-2 rounded-lg bg-cascade-purple/20 text-cascade-purple hover:bg-cascade-purple/30 transition-colors"
              >
                History
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
