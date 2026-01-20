import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const entity = searchParams.get('entity')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query parameters for backend API
    const queryParams: Record<string, string> = {}
    if (userId) queryParams.user = userId
    if (action) queryParams.action = action
    if (entity) queryParams.entity = entity
    if (startDate) queryParams.start_date = startDate
    if (endDate) queryParams.end_date = endDate
    if (limit) queryParams.limit = limit.toString()

    const response = await fetchAPI<{ results: any[] }>('/audit/', { query: queryParams })
    const logs = response.results || []

    const transformedLogs = logs.map((log: any) => ({
      id: log.id,
      userId: log.user || log.userId,
      action: log.action,
      entity: log.entity,
      entityId: log.entity_id || log.entityId,
      details: log.details,
      ipAddress: log.ip_address || log.ipAddress,
      userAgent: log.user_agent || log.userAgent,
      createdAt: log.created_at || log.createdAt,
      user: log.user_details || log.user,
    }))

    return NextResponse.json(transformedLogs)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, action, entity, entityId, details, ipAddress, userAgent } = body

    if (!action || !entity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const log = await fetchAPI('/audit/', {
      method: 'POST',
      body: JSON.stringify({
        user: userId,
        action,
        entity,
        entity_id: entityId,
        details,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
    })

    return NextResponse.json(log)
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}
