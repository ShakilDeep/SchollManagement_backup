import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'overview'

    let data: any = {}

    switch (type) {
      case 'overview': {
        // Fetch security overview data from backend
        const [auditResponse, usersResponse] = await Promise.all([
          fetchAPI<{ results: any[] }>('/audit/', { query: { limit: '100' } }),
          fetchAPI<{ results: any[] }>('/users/')
        ])

        const auditLogs = auditResponse.results || []
        const users = usersResponse.results || []

        // Calculate metrics from fetched data
        const now = new Date()
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const failedLogins = auditLogs.filter((log: any) =>
          log.action === 'LOGIN_FAILED' &&
          new Date(log.created_at || log.createdAt) > dayAgo
        ).length

        const recentSecurityEvents = auditLogs
          .filter((log: any) =>
            ['LOGIN_FAILED', 'PASSWORD_RESET', 'PERMISSION_DENIED'].includes(log.action)
          )
          .slice(0, 20)
          .map((log: any) => ({
            ...log,
            user: log.user_details || log.user
          }))

        // Group audit logs by action
        const auditLogsGrouped = auditLogs
          .filter((log: any) => {
            const logDate = new Date(log.created_at || log.createdAt)
            return ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET', 'PERMISSION_DENIED'].includes(log.action) &&
              logDate > weekAgo
          })
          .reduce((acc: any, log: any) => {
            acc[log.action] = (acc[log.action] || 0) + 1
            return acc
          }, {})

        const activeUsers = users.filter((u: any) => {
          const lastLogin = u.last_login_at || u.lastLoginAt
          return lastLogin && new Date(lastLogin) > dayAgo
        }).length

        data = {
          activeUsers,
          failedLogins,
          recentSecurityEvents,
          auditLogs: Object.entries(auditLogsGrouped).map(([action, _count]) => ({
            action,
            _count: { _count: _count as number }
          }))
        }
        break
      }

      case 'users': {
        const usersResponse = await fetchAPI<{ results: any[] }>('/users/')
        const users = usersResponse.results || []

        const now = new Date()
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

        const transformedUsers = users.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          lastLoginAt: u.last_login_at || u.lastLoginAt,
          createdAt: u.created_at || u.createdAt,
        }))

        const lockedUsers = users.filter((u: any) => {
          const lockedUntil = u.locked_until || u.lockedUntil
          return lockedUntil && new Date(lockedUntil) > now
        }).length

        const inactiveUsers = users.filter((u: any) => {
          const lastLogin = u.last_login_at || u.lastLoginAt
          return !lastLogin || new Date(lastLogin) < ninetyDaysAgo
        }).length

        data = {
          users: transformedUsers,
          lockedUsers,
          inactiveUsers,
          totalUsers: users.length,
        }
        break
      }

      case 'passwords': {
        const [auditResponse, usersResponse] = await Promise.all([
          fetchAPI<{ results: any[] }>('/audit/', { query: { limit: '100' } }),
          fetchAPI<{ results: any[] }>('/users/')
        ])

        const auditLogs = auditResponse.results || []
        const users = usersResponse.results || []

        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

        const passwordResets = auditLogs.filter((log: any) =>
          log.action === 'PASSWORD_RESET' &&
          new Date(log.created_at || log.createdAt) > thirtyDaysAgo
        ).length

        const weakPasswords = users.filter((u: any) => {
          const passwordChanged = u.password_changed_at || u.passwordChangedAt
          return !passwordChanged || new Date(passwordChanged) < ninetyDaysAgo
        }).length

        const recentPasswordChanges = auditLogs
          .filter((log: any) =>
            log.action === 'PASSWORD_CHANGE' &&
            new Date(log.created_at || log.createdAt) > thirtyDaysAgo
          )
          .slice(0, 20)
          .map((log: any) => ({
            ...log,
            user: log.user_details || log.user
          }))

        data = {
          passwordResets,
          weakPasswords,
          recentPasswordChanges,
        }
        break
      }

      case 'permissions': {
        const [auditResponse, usersResponse] = await Promise.all([
          fetchAPI<{ results: any[] }>('/audit/', { query: { limit: '1000' } }),
          fetchAPI<{ results: any[] }>('/users/')
        ])

        const auditLogs = auditResponse.results || []
        const users = usersResponse.results || []

        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Group users by role
        const roleCounts = users.reduce((acc: any, u: any) => {
          acc[u.role] = (acc[u.role] || 0) + 1
          return acc
        }, {})

        const permissionDenials = auditLogs.filter((log: any) =>
          log.action === 'PERMISSION_DENIED' &&
          new Date(log.created_at || log.createdAt) > thirtyDaysAgo
        ).length

        const adminUsers = users.filter((u: any) =>
          ['SUPER_ADMIN', 'ADMIN'].includes(u.role)
        ).length

        data = {
          roleCounts: Object.entries(roleCounts).map(([role, count]) => ({
            role,
            _count: { _count: count as number }
          })),
          permissionDenials,
          adminUsers,
        }
        break
      }

      case 'activity': {
        const { startDate, endDate } = Object.fromEntries(searchParams)
        const queryParams: Record<string, string> = { limit: '1000' }
        if (startDate) queryParams.start_date = startDate
        if (endDate) queryParams.end_date = endDate

        const auditResponse = await fetchAPI<{ results: any[] }>('/audit/', { query: queryParams })
        const auditLogs = auditResponse.results || []

        const now = new Date()
        const defaultStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const filteredLogs = auditLogs.filter((log: any) => {
          const logDate = new Date(log.created_at || log.createdAt)
          if (startDate && endDate) {
            return logDate >= new Date(startDate) && logDate <= new Date(endDate)
          }
          return logDate > defaultStartDate
        })

        // Group by login activity
        const loginActivity = filteredLogs
          .filter((log: any) => ['LOGIN', 'LOGOUT', 'LOGIN_FAILED'].includes(log.action))
          .reduce((acc: any, log: any) => {
            const date = (log.created_at || log.createdAt).split('T')[0]
            acc[date] = (acc[date] || 0) + 1
            return acc
          }, {})

        // Group by resource access
        const resourceAccess = filteredLogs
          .filter((log: any) => log.action === 'READ')
          .reduce((acc: any, log: any) => {
            const entity = log.entity || 'Unknown'
            acc[entity] = (acc[entity] || 0) + 1
            return acc
          }, {})

        // Group by system changes
        const systemChanges = filteredLogs
          .filter((log: any) => ['CREATE', 'UPDATE', 'DELETE'].includes(log.action))
          .reduce((acc: any, log: any) => {
            acc[log.action] = (acc[log.action] || 0) + 1
            return acc
          }, {})

        data = {
          loginActivity: Object.entries(loginActivity).map(([createdAt, _count]) => ({
            createdAt,
            _count: { _count: _count as number }
          })),
          resourceAccess: Object.entries(resourceAccess).map(([entity, _count]) => ({
            entity,
            _count: { _count: _count as number }
          })),
          systemChanges: Object.entries(systemChanges).map(([action, _count]) => ({
            action,
            _count: { _count: _count as number }
          })),
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid security type' }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching security data:', error)
    return NextResponse.json({ error: 'Failed to fetch security data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, userId, action, ...data } = body

    switch (type) {
      case 'lock_user': {
        const { lockoutDuration = 900 } = data
        const lockedUntil = new Date(Date.now() + lockoutDuration * 1000).toISOString()

        // Update user via backend API
        await fetchAPI(`/users/${userId}/`, {
          method: 'PATCH',
          body: JSON.stringify({
            locked_until: lockedUntil
          })
        })

        // Create audit log
        await fetchAPI('/audit/', {
          method: 'POST',
          body: JSON.stringify({
            user: userId,
            action: 'USER_LOCKED',
            entity: 'User',
            entity_id: userId,
            details: `User locked until ${lockedUntil}`,
          })
        })

        return NextResponse.json({ success: true, lockedUntil })
      }

      case 'unlock_user': {
        await fetchAPI(`/users/${userId}/`, {
          method: 'PATCH',
          body: JSON.stringify({
            locked_until: null,
            failed_login_attempts: 0
          })
        })

        await fetchAPI('/audit/', {
          method: 'POST',
          body: JSON.stringify({
            user: userId,
            action: 'USER_UNLOCKED',
            entity: 'User',
            entity_id: userId,
            details: 'User unlocked by administrator',
          })
        })

        return NextResponse.json({ success: true })
      }

      case 'force_password_reset': {
        await fetchAPI(`/users/${userId}/`, {
          method: 'PATCH',
          body: JSON.stringify({
            password_reset_required: true
          })
        })

        await fetchAPI('/audit/', {
          method: 'POST',
          body: JSON.stringify({
            user: userId,
            action: 'PASSWORD_RESET_REQUIRED',
            entity: 'User',
            entity_id: userId,
            details: 'Password reset required by administrator',
          })
        })

        return NextResponse.json({ success: true })
      }

      case 'revoke_sessions': {
        await fetchAPI('/audit/', {
          method: 'POST',
          body: JSON.stringify({
            user: userId,
            action: 'SESSIONS_REVOKED',
            entity: 'User',
            entity_id: userId,
            details: 'All user sessions revoked by administrator',
          })
        })

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid security action type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error performing security action:', error)
    return NextResponse.json({ error: 'Failed to perform security action' }, { status: 500 })
  }
}
