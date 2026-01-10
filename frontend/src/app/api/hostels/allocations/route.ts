import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const allocations = await db.hostelAllocation.findMany({
      include: {
        hostel: true,
        room: true,
        student: {
          include: {
            grade: true,
          },
        },
      },
      orderBy: {
        allocationDate: 'desc',
      },
    })

    const formattedAllocations = allocations.map(allocation => ({
      id: allocation.id,
      hostelId: allocation.hostelId,
      roomId: allocation.roomId,
      studentId: allocation.studentId,
      academicYearId: allocation.academicYearId,
      allocationDate: allocation.allocationDate,
      checkoutDate: allocation.checkoutDate,
      fees: allocation.fees,
      status: allocation.status,
      hostel: {
        id: allocation.hostel.id,
        name: allocation.hostel.name,
        type: allocation.hostel.type,
      },
      room: {
        id: allocation.room.id,
        roomNumber: allocation.room.roomNumber,
        floor: allocation.room.floor,
        capacity: allocation.room.capacity,
      },
      student: {
        id: allocation.student.id,
        firstName: allocation.student.firstName,
        lastName: allocation.student.lastName,
        rollNumber: allocation.student.rollNumber,
        grade: {
          name: allocation.student.grade.name,
        },
      },
    }))

    return NextResponse.json(formattedAllocations)
  } catch (error) {
    console.error('[ALLOCATIONS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      hostelId,
      roomId,
      studentId,
      academicYearId,
      fees,
    } = body

    if (!hostelId || !roomId || !studentId || !academicYearId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const allocation = await db.hostelAllocation.create({
      data: {
        hostelId,
        roomId,
        studentId,
        academicYearId,
        allocationDate: new Date(),
        fees: fees ? parseFloat(fees) : null,
        status: 'Active',
      },
    })

    return NextResponse.json(allocation, { status: 201 })
  } catch (error) {
    console.error('[ALLOCATIONS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
