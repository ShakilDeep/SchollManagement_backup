import { NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET() {
  try {
    const response = await fetchAPI<{ results: any[] }>('/hostels/rooms/')
    const rooms = response.results || []

    const formattedRooms = rooms.map((room: any) => ({
      id: room.id,
      hostelId: room.hostel || room.hostelId,
      roomNumber: room.room_number || room.roomNumber,
      floor: room.floor,
      capacity: room.capacity || 0,
      currentOccupancy: room.current_occupancy || room.currentOccupancy || 0,
      type: room.type,
      hostel: room.hostel_details || room.hostel,
      allocations: room.allocations || [],
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

    const room = await fetchAPI('/hostels/rooms/', {
      method: 'POST',
      body: JSON.stringify({
        hostel: hostelId,
        room_number: roomNumber,
        floor: parseInt(floor),
        capacity: parseInt(capacity),
        type,
      })
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('[ROOMS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
