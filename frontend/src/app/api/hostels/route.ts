import { NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET() {
  try {
    const response = await fetchAPI<{ results: any[] }>('/hostels/')
    const hostels = response.results || []

    const formattedHostels = hostels.map((hostel: any) => ({
      id: hostel.id,
      name: hostel.name || 'Unknown',
      type: hostel.type,
      capacity: hostel.capacity || 0,
      currentOccupancy: hostel.current_occupancy || hostel.currentOccupancy || 0,
      wardenName: hostel.warden_name || hostel.wardenName,
      wardenPhone: hostel.warden_phone || hostel.wardenPhone,
      address: hostel.address,
      rooms: hostel.rooms || [],
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

    const hostel = await fetchAPI('/hostels/', {
      method: 'POST',
      body: JSON.stringify({
        name,
        type,
        capacity: parseInt(capacity),
        warden_name: wardenName,
        warden_phone: wardenPhone,
        address,
      })
    })

    return NextResponse.json(hostel, { status: 201 })
  } catch (error) {
    console.error('[HOSTELS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
