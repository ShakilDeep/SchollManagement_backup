import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const asset = await db.asset.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    const responseData = {
      id: asset.id,
      assetCode: asset.assetCode,
      name: asset.name,
      category: asset.category,
      description: asset.description,
      serialNumber: asset.serialNumber,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString().split('T')[0] : null,
      purchasePrice: asset.purchasePrice,
      currentValue: asset.currentValue,
      condition: asset.condition,
      location: asset.location,
      assignedTo: asset.assignedTo,
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

    const asset = await db.asset.update({
      where: {
        id: params.id,
      },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(purchaseDate && { purchaseDate: new Date(purchaseDate) }),
        ...(purchasePrice !== undefined && { purchasePrice: parseFloat(purchasePrice) }),
        ...(currentValue !== undefined && { currentValue: parseFloat(currentValue) }),
        ...(condition && { condition }),
        ...(location !== undefined && { location }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(status && { status }),
      },
    })

    const responseData = {
      id: asset.id,
      assetCode: asset.assetCode,
      name: asset.name,
      category: asset.category,
      description: asset.description,
      serialNumber: asset.serialNumber,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString().split('T')[0] : null,
      purchasePrice: asset.purchasePrice,
      currentValue: asset.currentValue,
      condition: asset.condition,
      location: asset.location,
      assignedTo: asset.assignedTo,
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
    await db.asset.delete({
      where: {
        id: params.id,
      },
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
