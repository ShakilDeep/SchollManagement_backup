import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const asset = await fetchAPI<any>(`/inventory/${params.id}/`)

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

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching asset:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const asset = await fetchAPI(`/inventory/${params.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...(name && { name }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(serialNumber !== undefined && { serial_number: serialNumber }),
        ...(purchaseDate && { purchase_date: purchaseDate }),
        ...(purchasePrice !== undefined && { purchase_price: parseFloat(purchasePrice) }),
        ...(currentValue !== undefined && { current_value: parseFloat(currentValue) }),
        ...(condition && { condition }),
        ...(location !== undefined && { location }),
        ...(assignedTo !== undefined && { assigned_to: assignedTo }),
        ...(status && { status }),
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

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error updating asset:', error)
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await fetchAPI(`/inventory/${params.id}/`, {
      method: 'DELETE'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}
