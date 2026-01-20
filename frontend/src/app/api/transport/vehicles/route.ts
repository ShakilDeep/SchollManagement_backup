import { NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET() {
  try {
    const response = await fetchAPI<{ results: any[] }>('/transport/vehicles/')
    const vehicles = response.results || []

    const transformedVehicles = vehicles.map((v: any) => ({
      id: v.id,
      vehicleNumber: v.vehicle_number || v.vehicleNumber,
      type: v.type,
      capacity: v.capacity,
      driverName: v.driver_name || v.driverName,
      driverPhone: v.driver_phone || v.driverPhone,
      routeNumber: v.route_number || v.routeNumber,
      model: v.model,
      licensePlate: v.license_plate || v.licensePlate,
      insuranceExpiry: v.insurance_expiry || v.insuranceExpiry,
      status: v.status || 'Active',
    }))

    return NextResponse.json(transformedVehicles)
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

    const vehicle = await fetchAPI('/transport/vehicles/', {
      method: 'POST',
      body: JSON.stringify({
        vehicle_number: vehicleNumber,
        type,
        capacity: parseInt(capacity),
        driver_name: driverName,
        driver_phone: driverPhone,
        route_number: routeNumber,
        model,
        license_plate: licensePlate,
        insurance_expiry: insuranceExpiry,
        status: status || 'Active',
      })
    })

    const transformedVehicle = {
      id: vehicle.id,
      vehicleNumber: vehicle.vehicle_number || vehicle.vehicleNumber,
      type: vehicle.type,
      capacity: vehicle.capacity,
      driverName: vehicle.driver_name || vehicle.driverName,
      driverPhone: vehicle.driver_phone || vehicle.driverPhone,
      routeNumber: vehicle.route_number || vehicle.routeNumber,
      model: vehicle.model,
      licensePlate: vehicle.license_plate || vehicle.licensePlate,
      insuranceExpiry: vehicle.insurance_expiry || vehicle.insuranceExpiry,
      status: vehicle.status,
    }

    return NextResponse.json(transformedVehicle)
  } catch (error) {
    console.error('[VEHICLES_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
