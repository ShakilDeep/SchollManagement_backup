import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const hostels = await db.hostel.findMany({
      include: {
        rooms: {
          orderBy: {
            roomNumber: 'asc',
          },
        },
        allocations: {
          where: {
            status: 'Active',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(hostels)
  } catch (error) {
    console.error('[HOSTELS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      name,
      type,
      capacity,
      wardenName,
      wardenPhone,
      address,
    } = body

    if (!name || !type || !capacity) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const hostel = await db.hostel.create({
      data: {
        name,
        type,
        capacity: parseInt(capacity),
        currentOccupancy: 0,
        wardenName,
        wardenPhone,
        address,
      },
    })

    return NextResponse.json(hostel)
  } catch (error) {
    console.error('[HOSTELS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
