import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (studentId) where.studentId = studentId
    if (type) where.type = type
    if (category) where.category = category
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const records = await db.behaviorRecord.findMany({
      where,
      include: {
        Student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            grade: {
              select: {
                id: true,
                name: true,
              },
            },
            section: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(records)
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

    const record = await db.behaviorRecord.create({
      data: {
        studentId,
        type,
        category,
        description,
        points: points || 0,
        reportedBy,
        actionTaken,
        parentNotified: parentNotified || false,
      },
      include: {
        Student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
          },
        },
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error creating behavior record:', error)
    return NextResponse.json({ error: 'Failed to create behavior record' }, { status: 500 })
  }
}
