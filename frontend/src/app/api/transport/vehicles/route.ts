import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const vehicles = await db.vehicle.findMany({
      orderBy: {
        vehicleNumber: 'asc',
      },
    })

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('[VEHICLES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      vehicleNumber,
      type,
      capacity,
      driverName,
      driverPhone,
      routeNumber,
      model,
      licensePlate,
      insuranceExpiry,
      status,
    } = body

    if (!vehicleNumber || !type || !capacity || !driverName || !driverPhone) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const vehicle = await db.vehicle.create({
      data: {
        vehicleNumber,
        type,
        capacity: parseInt(capacity),
        driverName,
        driverPhone,
        routeNumber,
        model,
        licensePlate,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        status: status || 'Active',
      },
    })

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error('[VEHICLES_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
