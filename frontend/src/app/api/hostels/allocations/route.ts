import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const allocations = await db.hostelAllocation.findMany({
      include: {
        hostel: true,
        room: true,
        student: true,
      },
      orderBy: {
        allocationDate: 'desc',
      },
    })

    return NextResponse.json(allocations)
  } catch (error) {
    console.error('[HOSTEL_ALLOCATIONS_GET]', error)
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
        fees: fees ? parseFloat(fees) : null,
        status: 'Active',
      },
    })

    await db.room.update({
      where: { id: roomId },
      data: {
        currentOccupancy: {
          increment: 1,
        },
      },
    })

    await db.hostel.update({
      where: { id: hostelId },
      data: {
        currentOccupancy: {
          increment: 1,
        },
      },
    })

    return NextResponse.json(allocation)
  } catch (error) {
    console.error('[HOSTEL_ALLOCATIONS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
