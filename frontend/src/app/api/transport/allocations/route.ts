import { NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET() {
  try {
    const response = await fetchAPI<{ results: any[] }>('/transport/allocations/')
    const allocations = response.results || []

    const transformedAllocations = allocations.map((a: any) => ({
      id: a.id,
      vehicleId: a.vehicle || a.vehicleId,
      studentId: a.student || a.studentId,
      pickupPoint: a.pickup_point || a.pickupPoint,
      pickupTime: a.pickup_time || a.pickupTime,
      dropPoint: a.drop_point || a.dropPoint,
      dropTime: a.drop_time || a.dropTime,
      academicYearId: a.academic_year || a.academicYearId,
      fees: a.fees,
      vehicle: a.vehicle_details || a.vehicle,
      student: a.student_details || a.student,
    }))

    return NextResponse.json(transformedAllocations)
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

    const allocation = await fetchAPI('/transport/allocations/', {
      method: 'POST',
      body: JSON.stringify({
        vehicle: vehicleId,
        student: studentId,
        pickup_point: pickupPoint,
        pickup_time: pickupTime,
        drop_point: dropPoint,
        drop_time: dropTime,
        academic_year: academicYearId,
        fees: fees ? parseFloat(fees) : null,
      })
    })

    return NextResponse.json(allocation)
  } catch (error) {
    console.error('[ALLOCATIONS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
