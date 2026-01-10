import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'overview'

    let data = {}

    switch (type) {
      case 'overview': {
        const [activeUsers, failedLogins, recentSecurityEvents, auditLogs] = await Promise.all([
          db.user.count({
            where: {
              lastLoginAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          }),
          db.auditLog.count({
            where: {
              action: 'LOGIN_FAILED',
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          }),
          db.auditLog.findMany({
            where: {
              action: {
                in: ['LOGIN_FAILED', 'PASSWORD_RESET', 'PERMISSION_DENIED'],
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          }),
          db.auditLog.groupBy({
            by: ['action'],
            _count: true,
            where: {
              action: {
                in: ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET', 'PERMISSION_DENIED'],
              },
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          }),
        ])

        data = {
          activeUsers,
          failedLogins,
          recentSecurityEvents,
          auditLogs,
        }
        break
      }

      case 'users': {
        const [users, lockedUsers, inactiveUsers] = await Promise.all([
          db.user.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              lastLoginAt: true,
              createdAt: true,
            },
            orderBy: { lastLoginAt: 'desc' },
          }),
          db.user.count({
            where: {
              lockedUntil: {
                gt: new Date(),
              },
            },
          }),
          db.user.count({
            where: {
              lastLoginAt: {
                lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
              },
            },
          }),
        ])

        data = {
          users,
          lockedUsers,
          inactiveUsers,
          totalUsers: users.length,
        }
        break
      }

      case 'passwords': {
        const [passwordResets, weakPasswords, recentPasswordChanges] = await Promise.all([
          db.auditLog.count({
            where: {
              action: 'PASSWORD_RESET',
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          }),
          db.user.count({
            where: {
              passwordChangedAt: {
                lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
              },
            },
          }),
          db.auditLog.findMany({
            where: {
              action: 'PASSWORD_CHANGE',
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          }),
        ])

        data = {
          passwordResets,
          weakPasswords,
          recentPasswordChanges,
        }
        break
      }

      case 'permissions': {
        const [roleCounts, permissionDenials, adminUsers] = await Promise.all([
          db.user.groupBy({
            by: ['role'],
            _count: true,
          }),
          db.auditLog.count({
            where: {
              action: 'PERMISSION_DENIED',
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          }),
          db.user.count({
            where: {
              role: {
                in: ['SUPER_ADMIN', 'ADMIN'],
              },
            },
          }),
        ])

        data = {
          roleCounts,
          permissionDenials,
          adminUsers,
        }
        break
      }

      case 'activity': {
        const { startDate, endDate } = Object.fromEntries(searchParams)
        const where: any = {}
        
        if (startDate && endDate) {
          where.createdAt = {
            gte: new Date(startDate),
            lte: new Date(endDate),
          }
        } else {
          where.createdAt = {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          }
        }

        const [loginActivity, resourceAccess, systemChanges] = await Promise.all([
          db.auditLog.groupBy({
            by: ['createdAt'],
            _count: true,
            where: {
              ...where,
              action: {
                in: ['LOGIN', 'LOGOUT', 'LOGIN_FAILED'],
              },
            },
          }),
          db.auditLog.groupBy({
            by: ['entity'],
            _count: true,
            where: {
              ...where,
              action: 'READ',
            },
          }),
          db.auditLog.groupBy({
            by: ['action'],
            _count: true,
            where: {
              ...where,
              action: {
                in: ['CREATE', 'UPDATE', 'DELETE'],
              },
            },
          }),
        ])

        data = {
          loginActivity,
          resourceAccess,
          systemChanges,
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
        const lockedUntil = new Date(Date.now() + lockoutDuration * 1000)

        await db.user.update({
          where: { id: userId },
          data: { lockedUntil },
        })

        await db.auditLog.create({
          data: {
            userId,
            action: 'USER_LOCKED',
            entity: 'User',
            entityId: userId,
            details: `User locked until ${lockedUntil.toISOString()}`,
          },
        })

        return NextResponse.json({ success: true, lockedUntil })
      }

      case 'unlock_user': {
        await db.user.update({
          where: { id: userId },
          data: { lockedUntil: null, failedLoginAttempts: 0 },
        })

        await db.auditLog.create({
          data: {
            userId,
            action: 'USER_UNLOCKED',
            entity: 'User',
            entityId: userId,
            details: 'User unlocked by administrator',
          },
        })

        return NextResponse.json({ success: true })
      }

      case 'force_password_reset': {
        await db.user.update({
          where: { id: userId },
          data: { passwordResetRequired: true },
        })

        await db.auditLog.create({
          data: {
            userId,
            action: 'PASSWORD_RESET_REQUIRED',
            entity: 'User',
            entityId: userId,
            details: 'Password reset required by administrator',
          },
        })

        return NextResponse.json({ success: true })
      }

      case 'revoke_sessions': {
        await db.auditLog.create({
          data: {
            userId,
            action: 'SESSIONS_REVOKED',
            entity: 'User',
            entityId: userId,
            details: 'All user sessions revoked by administrator',
          },
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
