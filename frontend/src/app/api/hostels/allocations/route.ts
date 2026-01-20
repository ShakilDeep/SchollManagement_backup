import { NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET() {
  try {
    const response = await fetchAPI<{ results: any[] }>('/hostels/allocations/')
    const allocations = response.results || []

    const formattedAllocations = allocations.map((allocation: any) => ({
      id: allocation.id,
      hostelId: allocation.hostel || allocation.hostelId,
      roomId: allocation.room || allocation.roomId,
      studentId: allocation.student || allocation.studentId,
      academicYearId: allocation.academic_year || allocation.academicYearId,
      allocationDate: allocation.allocation_date || allocation.allocationDate,
      checkoutDate: allocation.checkout_date || allocation.checkoutDate,
      fees: allocation.fees,
      status: allocation.status || 'Active',
      hostel: allocation.hostel_details || allocation.hostel,
      room: allocation.room_details || allocation.room,
      student: allocation.student_details || allocation.student,
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

    const allocation = await fetchAPI('/hostels/allocations/', {
      method: 'POST',
      body: JSON.stringify({
        hostel: hostelId,
        room: roomId,
        student: studentId,
        academic_year: academicYearId,
        fees: fees ? parseFloat(fees) : null,
        status: 'Active',
      })
    })

    return NextResponse.json(allocation, { status: 201 })
  } catch (error) {
    console.error('[ALLOCATIONS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
