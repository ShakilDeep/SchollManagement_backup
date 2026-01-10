import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const hostels = await db.hostel.findMany({
      include: {
        rooms: {
          include: {
            allocations: {
              where: { status: 'Active' },
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    rollNumber: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    })

    const formattedHostels = hostels.map(hostel => ({
      id: hostel.id,
      name: hostel.name,
      type: hostel.type,
      capacity: hostel.capacity,
      currentOccupancy: hostel.rooms.reduce((sum, room) => sum + room.allocations.length, 0),
      wardenName: hostel.wardenName,
      wardenPhone: hostel.wardenPhone,
      address: hostel.address,
      rooms: hostel.rooms.map(room => ({
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        capacity: room.capacity,
        currentOccupancy: room.allocations.length,
        type: room.type,
      })),
    }))

    return NextResponse.json(formattedHostels)
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
        wardenName,
        wardenPhone,
        address,
      },
    })

    return NextResponse.json(hostel, { status: 201 })
  } catch (error) {
    console.error('[HOSTELS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
