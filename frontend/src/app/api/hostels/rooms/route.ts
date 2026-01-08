import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const rooms = await db.room.findMany({
      include: {
        hostel: true,
        allocations: {
          where: {
            status: 'Active',
          },
          include: {
            student: true,
          },
        },
      },
      orderBy: {
        hostelId: 'asc',
      },
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('[ROOMS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      hostelId,
      roomNumber,
      floor,
      capacity,
      type,
      facilities,
    } = body

    if (!hostelId || !roomNumber || !capacity) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const room = await db.room.create({
      data: {
        hostelId,
        roomNumber,
        floor: parseInt(floor) || 1,
        capacity: parseInt(capacity),
        currentOccupancy: 0,
        type,
        facilities,
      },
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('[ROOMS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
