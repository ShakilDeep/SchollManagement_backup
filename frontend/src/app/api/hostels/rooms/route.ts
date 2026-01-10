import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const rooms = await db.room.findMany({
      include: {
        hostel: true,
        allocations: {
          where: { status: 'Active' },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                rollNumber: true,
                grade: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        hostel: {
          name: 'asc'
        }
      }
    })

    const formattedRooms = rooms.map(room => ({
      id: room.id,
      hostelId: room.hostelId,
      roomNumber: room.roomNumber,
      floor: room.floor,
      capacity: room.capacity,
      currentOccupancy: room.allocations.length,
      type: room.type,
      hostel: {
        id: room.hostel.id,
        name: room.hostel.name,
        type: room.hostel.type,
      },
      allocations: room.allocations.map(allocation => ({
        id: allocation.id,
        studentId: allocation.studentId,
        student: {
          id: allocation.student.id,
          firstName: allocation.student.firstName,
          lastName: allocation.student.lastName,
          rollNumber: allocation.student.rollNumber,
          grade: allocation.student.grade.name,
        },
        allocationDate: allocation.allocationDate,
        status: allocation.status,
      })),
    }))

    return NextResponse.json(formattedRooms)
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
    } = body

    if (!hostelId || !roomNumber || !floor || !capacity) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const room = await db.room.create({
      data: {
        hostelId,
        roomNumber,
        floor: parseInt(floor),
        capacity: parseInt(capacity),
        type,
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('[ROOMS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
