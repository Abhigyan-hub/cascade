import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { Plus, Calendar, Users, Settings } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminDashboard({ profile }) {
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({ totalRegistrations: 0, pendingCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return

    async function fetch() {
      const { data: created } = await supabase
        .from('events')
        .select('id, name, event_date, fee_amount, is_published, created_at')
        .eq('created_by', profile.id)

      const { data: adminRows } = await supabase
        .from('event_admins')
        .select('event_id')
        .eq('admin_id', profile.id)

      const adminIds = adminRows?.map((r) => r.event_id) || []
      let adminEvents = []
      if (adminIds.length > 0) {
        const { data } = await supabase
          .from('events')
          .select('id, name, event_date, fee_amount, is_published, created_at')
          .in('id', adminIds)
        adminEvents = data || []
      }

      const merged = [...(created || []), ...adminEvents]
      const unique = Array.from(new Map(merged.map((e) => [e.id, e])).values())
      setEvents(unique)

      const eventIds = unique.map((e) => e.id)
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
      }

      setLoading(false)
    }
    fetch()
  }, [profile?.id])

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
                    to={`/events/${e.id}`}
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
                    to={`/admin/events/${e.id}/edit`}
                    className="btn-secondary py-2"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/admin/events/${e.id}/registrations`}
                    className="btn-primary py-2"
                  >
                    Registrations
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
