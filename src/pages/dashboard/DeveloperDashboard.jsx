import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'
import {
  Users,
  Calendar,
  CreditCard,
  Activity,
  Search,
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../../lib/authContext'
import PageHeader from '../../components/PageHeader'
import FormAlert from '../../components/FormAlert'
import { toUserMessage, USER_MESSAGES } from '../../lib/userMessage'

function rupees(paise) {
  return `₹${((Number(paise) || 0) / 100).toLocaleString('en-IN')}`
}

export default function DeveloperDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    registrations: 0,
    payments: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [users, setUsers] = useState([])
  const [payments, setPayments] = useState([])
  const [userQuery, setUserQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    async function fetch() {
      try {
        const [nextStats, activity, payList] = await Promise.all([
          api('/api/developer/stats'),
          api('/api/developer/activity?limit=20'),
          api('/api/developer/payments'),
        ])
        setStats(nextStats)
        setRecentActivity(activity || [])
        setPayments(payList || [])
        setLoadError('')
      } catch (err) {
        setLoadError(toUserMessage(err, USER_MESSAGES.loadPage))
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      setUsersLoading(true)
      try {
        const q = userQuery.trim()
        const path = q
          ? `/api/developer/users?limit=200&q=${encodeURIComponent(q)}`
          : '/api/developer/users?limit=200'
        const list = await api(path)
        if (!cancelled) setUsers(list || [])
      } catch {
        if (!cancelled) setUsers([])
      } finally {
        if (!cancelled) setUsersLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [userQuery])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Super Admin"
          subtitle={
            profile?.full_name
              ? `Signed in as ${profile.full_name}`
              : 'Full system oversight'
          }
        />

        {loadError && (
          <div className="mb-6">
            <FormAlert type="error" title="Could not load overview">
              {loadError}
            </FormAlert>
          </div>
        )}

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cascade-purple" />
                All users
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="search"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search name or email"
                  className="input-cascade pl-10 py-2 text-sm"
                  aria-label="Search users"
                />
              </div>
            </div>
            {loading || usersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-cascade-dark rounded animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="text-gray-500">No users match that search.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-cascade-dark"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{u.full_name}</p>
                      <p className="text-gray-500 text-sm truncate">{u.email}</p>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded text-xs ${
                        u.role === 'developer'
                          ? 'bg-cascade-gold/20 text-cascade-gold'
                          : u.role === 'admin'
                            ? 'bg-cascade-purple/20 text-cascade-purple'
                            : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
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
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentActivity.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 p-2 rounded text-sm">
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

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            All payments
          </h2>
          {loading ? (
            <div className="h-24 bg-cascade-dark rounded animate-pulse" />
          ) : payments.length === 0 ? (
            <p className="text-gray-500">No payments recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Payer</th>
                    <th>Event</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <p className="text-white">{p.payer?.full_name || 'Unknown'}</p>
                        <p className="text-gray-500 text-xs">{p.payer?.email}</p>
                      </td>
                      <td>{p.event?.name || '—'}</td>
                      <td>{rupees(p.amount_paise)}</td>
                      <td className="capitalize">{p.status}</td>
                      <td>
                        {p.created_at ? format(new Date(p.created_at), 'MMM d, yyyy HH:mm') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
