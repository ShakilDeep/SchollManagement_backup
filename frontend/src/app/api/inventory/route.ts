import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const location = searchParams.get('location')

    // Build query parameters for backend API
    const queryParams: Record<string, string> = {}
    if (search) queryParams.search = search
    if (category) queryParams.category = category
    if (status) queryParams.status = status
    if (location) queryParams.location = location

    const response = await fetchAPI<{ results: any[] }>('/inventory/', { query: queryParams })
    const assets = response.results || []

    const formattedAssets = assets.map((asset: any) => ({
      id: asset.id,
      assetCode: asset.asset_code || asset.assetCode,
      name: asset.name || 'Unknown',
      category: asset.category,
      description: asset.description,
      serialNumber: asset.serial_number || asset.serialNumber,
      purchaseDate: asset.purchase_date || asset.purchaseDate || null,
      purchasePrice: asset.purchase_price || asset.purchasePrice,
      currentValue: asset.current_value || asset.currentValue,
      condition: asset.condition,
      location: asset.location,
      assignedTo: asset.assigned_to || asset.assignedTo,
      status: asset.status,
    }))

    return NextResponse.json(formattedAssets)
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      category,
      description,
      serialNumber,
      purchaseDate,
      purchasePrice,
      currentValue,
      condition,
      location,
      assignedTo,
      status,
    } = body

    if (!name || !category || !condition || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const asset = await fetchAPI('/inventory/', {
      method: 'POST',
      body: JSON.stringify({
        name,
        category,
        description,
        serial_number: serialNumber,
        purchase_date: purchaseDate,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        current_value: currentValue ? parseFloat(currentValue) : null,
        condition,
        location,
        assigned_to: assignedTo,
        status,
      })
    })

    const responseData = {
      id: asset.id,
      assetCode: asset.asset_code || asset.assetCode,
      name: asset.name,
      category: asset.category,
      description: asset.description,
      serialNumber: asset.serial_number || asset.serialNumber,
      purchaseDate: asset.purchase_date || asset.purchaseDate,
      purchasePrice: asset.purchase_price || asset.purchasePrice,
      currentValue: asset.current_value || asset.currentValue,
      condition: asset.condition,
      location: asset.location,
      assignedTo: asset.assigned_to || asset.assignedTo,
      status: asset.status,
    }

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error('Error creating asset:', error)
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}
