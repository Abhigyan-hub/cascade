'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { User, Event, Registration, Payment, ActivityLog } from '@/lib/supabase/types'

export default function DeveloperDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    totalPayments: 0,
    totalRevenue: 0,
  })
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    loadDashboard()
  }, [])

  async function checkUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push('/auth/signin')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!profile || profile.role !== 'developer') {
      router.push('/')
      return
    }

    setUser(profile)
  }

  async function loadDashboard() {
    // Load stats
    const [usersRes, eventsRes, regsRes, paymentsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('registrations').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('amount, status'),
    ])

    const totalRevenue = (paymentsRes.data || [])
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    setStats({
      totalUsers: usersRes.count || 0,
      totalEvents: eventsRes.count || 0,
      totalRegistrations: regsRes.count || 0,
      totalPayments: paymentsRes.data?.length || 0,
      totalRevenue,
    })

    // Load recent activity
    const { data: activityData } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    setRecentActivity(activityData || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Developer Dashboard</h1>
        <p className="text-muted-foreground">System-wide overview and management</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRegistrations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/developer/users')}
            >
              View All Users
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/developer/events')}
            >
              View All Events
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/developer/registrations')}
            >
              View All Registrations
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/developer/payments')}
            >
              View All Payments
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push('/developer/activity-logs')}
            >
              View Activity Logs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest admin actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                recentActivity.map((log) => (
                  <div key={log.id} className="border-b border-border pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{log.admin_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.action} {log.target_type}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatDate(log.created_at)}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
