import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { Plus, Calendar, Users, Settings, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../../lib/authContext'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({ totalRegistrations: 0, pendingCount: 0 })
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (!profile?.id) return

    async function fetch() {
      try {
        // Admins can see all events, so fetch all events they have access to
        const { data: allEvents, error: eventsError } = await supabase
          .from('events')
          .select('id, name, event_date, fee_amount, is_published, created_at')
          .order('created_at', { ascending: false })

        if (eventsError) {
          console.error('Error fetching events:', eventsError)
          setEvents([])
        } else {
          setEvents(allEvents || [])
        }

        const eventIds = (allEvents || []).map((e) => e.id)
        if (eventIds.length > 0) {
          const { count: total, error: totalError } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .in('event_id', eventIds)
          if (totalError) {
            console.error('Error counting total registrations:', totalError)
          }

          const { count: pending, error: pendingError } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .in('event_id', eventIds)
            .eq('status', 'pending')
          if (pendingError) {
            console.error('Error counting pending registrations:', pendingError)
          }

          setStats({ totalRegistrations: total || 0, pendingCount: pending || 0 })
        } else {
          setStats({ totalRegistrations: 0, pendingCount: 0 })
        }
      } catch (err) {
        console.error('Exception in AdminDashboard fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [profile?.id])

  async function handleDeleteEvent(eventId, eventName) {
    if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone and will also delete all registrations and related data.`)) {
      return
    }

    setDeletingId(eventId)
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) {
        console.error('Error deleting event:', error)
        toast.error(error.message || 'Failed to delete event')
        setDeletingId(null)
        return
      }

      toast.success('Event deleted successfully')
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
      
      // Update stats
      const eventIds = events.filter((e) => e.id !== eventId).map((e) => e.id)
      if (eventIds.length > 0) {
        const { count: total } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .in('event_id', eventIds)
        const { count: pending } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .in('event_id', eventIds)
          .eq('status', 'pending')
        setStats({ totalRegistrations: total || 0, pendingCount: pending || 0 })
      } else {
        setStats({ totalRegistrations: 0, pendingCount: 0 })
      }
    } catch (err) {
      console.error('Exception deleting event:', err)
      toast.error('Failed to delete event')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your events and registrations</p>
          </div>
          <Link
            to="/admin/events/new"
            className="btn-primary inline-flex items-center gap-2 w-fit"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cascade-purple/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-cascade-purple" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Registrations</p>
                <p className="text-2xl font-bold text-white">{stats.totalRegistrations}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cascade-gold/20 flex items-center justify-center">
                <Settings className="w-6 h-6 text-cascade-gold" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Pending Approval</p>
                <p className="text-2xl font-bold text-white">{stats.pendingCount}</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cascade-purple" />
          Your Events
        </h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-5 bg-cascade-dark rounded w-1/3" />
                <div className="h-4 bg-cascade-dark rounded w-1/2 mt-2" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500 mb-4">No events yet</p>
            <Link to="/admin/events/new" className="btn-primary inline-flex">
              Create your first event
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <Link
                    to="/events/$eventId"
                    params={{ eventId: e.id }}
                    className="font-semibold text-white hover:text-cascade-purple-light"
                  >
                    {e.name}
                  </Link>
                  <p className="text-gray-500 text-sm mt-1">
                    {format(new Date(e.event_date), 'MMM d, yyyy')}
                  </p>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                      e.is_published ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {e.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    to="/admin/events/$eventId/edit"
                    params={{ eventId: e.id }}
                    className="btn-secondary py-2"
                  >
                    Edit
                  </Link>
                  <Link
                    to="/admin/events/$eventId/registrations"
                    params={{ eventId: e.id }}
                    className="btn-primary py-2"
                  >
                    Registrations
                  </Link>
                  <button
                    onClick={() => handleDeleteEvent(e.id, e.name)}
                    disabled={deletingId === e.id}
                    className="btn-secondary py-2 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingId === e.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
