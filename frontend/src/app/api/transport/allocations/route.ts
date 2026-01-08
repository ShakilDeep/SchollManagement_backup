import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const allocations = await db.transportAllocation.findMany({
      include: {
        vehicle: true,
        student: {
          include: {
            grade: true,
          },
        },
      },
      orderBy: {
        vehicle: {
          vehicleNumber: 'asc',
        },
      },
    })

    return NextResponse.json(allocations)
  } catch (error) {
    console.error('[ALLOCATIONS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      vehicleId,
      studentId,
      pickupPoint,
      pickupTime,
      dropPoint,
      dropTime,
      academicYearId,
      fees,
    } = body

    if (!vehicleId || !studentId || !academicYearId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const allocation = await db.transportAllocation.create({
      data: {
        vehicleId,
        studentId,
        pickupPoint,
        pickupTime,
        dropPoint,
        dropTime,
        academicYearId,
        fees: fees ? parseFloat(fees) : null,
      },
    })

    return NextResponse.json(allocation)
  } catch (error) {
    console.error('[ALLOCATIONS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
