import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import {
  Users,
  Calendar,
  CreditCard,
  Activity,
  Shield,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../../lib/authContext'

export default function DeveloperDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    registrations: 0,
    payments: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const { count: users, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        if (usersError) console.error('Error counting users:', usersError)

        const { count: events, error: eventsError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
        if (eventsError) console.error('Error counting events:', eventsError)

        const { count: regs, error: regsError } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
        if (regsError) console.error('Error counting registrations:', regsError)

        const { count: pays, error: paysError } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
        if (paysError) console.error('Error counting payments:', paysError)

        setStats({
          users: users || 0,
          events: events || 0,
          registrations: regs || 0,
          payments: pays || 0,
        })

        const { data: activity, error: activityError } = await supabase
          .from('activity_logs')
          .select('*, profiles!activity_logs_actor_id_fkey(full_name)')
          .order('created_at', { ascending: false })
          .limit(10)
        if (activityError) {
          console.error('Error fetching activity logs:', activityError)
          setRecentActivity([])
        } else {
          setRecentActivity(activity || [])
        }

        const { data: usersList, error: usersListError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
        if (usersListError) {
          console.error('Error fetching recent users:', usersListError)
          setRecentUsers([])
        } else {
          setRecentUsers(usersList || [])
        }
      } catch (err) {
        console.error('Exception in DeveloperDashboard fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-cascade-gold/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-cascade-gold" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Super Admin</h1>
            <p className="text-gray-500">Full system oversight</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cascade-purple/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-cascade-purple" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.users}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cascade-gold/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-cascade-gold" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Events</p>
                <p className="text-2xl font-bold text-white">{stats.events}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Registrations</p>
                <p className="text-2xl font-bold text-white">{stats.registrations}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Payments</p>
                <p className="text-2xl font-bold text-white">{stats.payments}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-cascade-purple" />
              Recent Users
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-cascade-dark rounded animate-pulse" />
                ))}
              </div>
            ) : recentUsers.length === 0 ? (
              <p className="text-gray-500">No users yet</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((u) => (
                  <Link
                    key={u.id}
                    to="/developer"
                    className="flex items-center justify-between p-3 rounded-lg bg-cascade-dark hover:bg-cascade-surface-hover transition-colors"
                  >
                    <div>
                      <p className="font-medium text-white">{u.full_name}</p>
                      <p className="text-gray-500 text-sm">{u.email}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        u.role === 'developer'
                          ? 'bg-cascade-gold/20 text-cascade-gold'
                          : u.role === 'admin'
                          ? 'bg-cascade-purple/20 text-cascade-purple'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {u.role}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cascade-purple" />
              Activity Log
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-cascade-dark rounded animate-pulse" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-gray-500">No activity yet</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {recentActivity.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-2 p-2 rounded text-sm"
                  >
                    <span className="text-gray-500 shrink-0">
                      {format(new Date(a.created_at), 'MMM d, HH:mm')}
                    </span>
                    <span className="text-gray-400">
                      {a.profiles?.full_name || 'System'}: {a.action} {a.entity_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
