'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { ActivityLog } from '@/lib/supabase/types'

export default function ActivityLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    loadLogs()
  }, [])

  async function checkUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push('/auth/signin')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!profile || profile.role !== 'developer') {
      router.push('/')
      return
    }
  }

  async function loadLogs() {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })

    setLogs(data || [])
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
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          ← Back
        </Button>
        <h1 className="text-4xl font-bold mb-2">Activity Logs</h1>
        <p className="text-muted-foreground">View all admin actions and system activity</p>
      </div>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No activity logs found</p>
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold">{log.admin_name}</p>
                      <Badge
                        variant={
                          log.action === 'approve' ? 'accepted' :
                          log.action === 'reject' ? 'rejected' : 'default'
                        }
                      >
                        {log.action}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {log.target_type}
                      </span>
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="bg-muted p-3 rounded-md mt-2">
                        <pre className="text-xs text-muted-foreground">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground ml-4">
                    {formatDate(log.created_at)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
