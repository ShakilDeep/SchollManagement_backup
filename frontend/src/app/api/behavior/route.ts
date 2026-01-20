import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build query parameters for backend API
    const queryParams: Record<string, string> = {}
    if (studentId) queryParams.student = studentId
    if (type) queryParams.type = type
    if (category) queryParams.category = category
    if (startDate) queryParams.start_date = startDate
    if (endDate) queryParams.end_date = endDate

    const response = await fetchAPI<{ results: any[] }>('/behavior/', { query: queryParams })
    const records = response.results || []

    const transformedRecords = records.map((record: any) => ({
      id: record.id,
      studentId: record.student || record.studentId,
      type: record.type,
      category: record.category,
      description: record.description,
      points: record.points || 0,
      reportedBy: record.reported_by || record.reportedBy,
      actionTaken: record.action_taken || record.actionTaken,
      parentNotified: record.parent_notified || record.parentNotified || false,
      date: record.date || record.created_at || new Date().toISOString().split('T')[0],
      student: record.student_details || record.Student,
      reportedByUser: record.reported_by_details || record.User,
    }))

    return NextResponse.json(transformedRecords)
  } catch (error) {
    console.error('Error fetching behavior records:', error)
    return NextResponse.json({ error: 'Failed to fetch behavior records' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentId, type, category, description, points, reportedBy, actionTaken, parentNotified } = body

    if (!studentId || !type || !category || !description || !reportedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const record = await fetchAPI('/behavior/', {
      method: 'POST',
      body: JSON.stringify({
        student: studentId,
        type,
        category,
        description,
        points: points || 0,
        reported_by: reportedBy,
        action_taken: actionTaken,
        parent_notified: parentNotified || false,
      })
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error creating behavior record:', error)
    return NextResponse.json({ error: 'Failed to create behavior record' }, { status: 500 })
  }
}
