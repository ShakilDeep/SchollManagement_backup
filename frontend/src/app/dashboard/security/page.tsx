'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Shield,
  Users,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Unlock,
  Key,
  UserLock,
  Clock
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

export default function SecurityPage() {
  const [loading, setLoading] = useState(true)
  const [overviewData, setOverviewData] = useState<any>(null)
  const [usersData, setUsersData] = useState<any>(null)
  const [passwordsData, setPasswordsData] = useState<any>(null)
  const [permissionsData, setPermissionsData] = useState<any>(null)
  const [activityData, setActivityData] = useState<any>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [overview, users, passwords, permissions, activity] = await Promise.all([
        fetch('/api/security?type=overview').then(r => r.json()),
        fetch('/api/security?type=users').then(r => r.json()),
        fetch('/api/security?type=passwords').then(r => r.json()),
        fetch('/api/security?type=permissions').then(r => r.json()),
        fetch('/api/security?type=activity').then(r => r.json()),
      ])
      setOverviewData(overview)
      setUsersData(users)
      setPasswordsData(passwords)
      setPermissionsData(permissions)
      setActivityData(activity)
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Failed to load security data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSecurityAction = async (type: string, userId: string) => {
    try {
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, userId }),
      })
      if (!res.ok) throw new Error('Action failed')
      toast({ title: 'Success', description: 'Action completed successfully' })
      fetchAllData()
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Action failed', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Security Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage system security</p>
          </div>
          <Button onClick={fetchAllData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <Shield className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="passwords">
              <Lock className="h-4 w-4 mr-2" />
              Passwords
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <UserLock className="h-4 w-4 mr-2" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Clock className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users (24h)</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewData?.activeUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Users logged in today</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed Logins (24h)</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{overviewData?.failedLogins || 0}</div>
                  <p className="text-xs text-muted-foreground">Security incidents</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usersData?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Registered users</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Locked Users</CardTitle>
                  <Lock className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{usersData?.lockedUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Currently locked</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>Latest security-related activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overviewData?.recentSecurityEvents?.slice(0, 5).map((event: any, index: number) => (
                    <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        {event.action === 'LOGIN_FAILED' ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : event.action === 'PASSWORD_RESET' ? (
                          <Key className="h-4 w-4 text-warning" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium">{event.action.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.user?.name || event.user?.email || 'System'}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                  {(!overviewData?.recentSecurityEvents || overviewData.recentSecurityEvents.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No recent security events</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usersData?.totalUsers || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Locked Users</CardTitle>
                  <Lock className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{usersData?.lockedUsers || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inactive (90d+)</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usersData?.inactiveUsers || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>User List</CardTitle>
                <CardDescription>Manage user security settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usersData?.users?.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Lock className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Lock User Account</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to lock {user.name}'s account?
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => {}}>Cancel</Button>
                                <Button onClick={() => handleSecurityAction('lock_user', user.id)}>Lock</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="outline" onClick={() => handleSecurityAction('unlock_user', user.id)}>
                            <Unlock className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleSecurityAction('force_password_reset', user.id)}>
                            <Key className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="passwords">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Password Resets (30d)</CardTitle>
                  <Key className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{passwordsData?.passwordResets || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weak Passwords (90d+)</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">{passwordsData?.weakPasswords || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Changes</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{passwordsData?.recentPasswordChanges?.length || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Recent Password Changes</CardTitle>
                <CardDescription>Users who changed their password recently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {passwordsData?.recentPasswordChanges?.map((change: any, index: number) => (
                    <div key={index} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">{change.user?.name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{change.user?.email}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(change.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                  {(!passwordsData?.recentPasswordChanges || passwordsData.recentPasswordChanges.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No recent password changes</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Role Distribution</CardTitle>
                  <CardDescription>Users by role</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {permissionsData?.roleCounts?.map((role: any) => (
                      <div key={role.role} className="flex items-center justify-between">
                        <span className="font-medium">{role.role}</span>
                        <Badge>{role._count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Permission Denials</CardTitle>
                  <CardDescription>Access denied attempts (30d)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-destructive">
                    {permissionsData?.permissionDenials || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Users attempted to access restricted resources
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Admin Users</CardTitle>
                <CardDescription>Users with administrative privileges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{permissionsData?.adminUsers || 0}</div>
                <p className="text-sm text-muted-foreground">
                  Users with SUPER_ADMIN or ADMIN roles
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>System Activity</CardTitle>
                <CardDescription>User and system activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Login Activity</h4>
                    <div className="text-3xl font-bold">
                      {activityData?.loginActivity?.reduce((acc: number, item: any) => acc + item._count, 0) || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Login/Logout/Failed Login events</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Resource Access</h4>
                    <div className="space-y-2">
                      {activityData?.resourceAccess?.map((access: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span>{access.entity}</span>
                          <Badge>{access._count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">System Changes</h4>
                    <div className="space-y-2">
                      {activityData?.systemChanges?.map((change: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span>{change.action}</span>
                          <Badge>{change._count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
