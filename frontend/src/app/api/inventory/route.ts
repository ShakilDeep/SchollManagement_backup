import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const location = searchParams.get('location')

    const assets = await db.asset.findMany({
      where: {
        status: status || undefined,
        category: category || undefined,
        location: location || undefined,
        ...(search && {
          OR: [
            { name: { contains: search } },
            { assetCode: { contains: search } },
            { serialNumber: { contains: search } },
            { description: { contains: search } },
          ],
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedAssets = assets.map((asset) => ({
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

    const assetCode = `AST-${Date.now().toString().slice(-6)}`

    const asset = await db.asset.create({
      data: {
        assetCode,
        name,
        category,
        description,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        currentValue: currentValue ? parseFloat(currentValue) : null,
        condition,
        location,
        assignedTo,
        status,
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

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error('Error creating asset:', error)
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}
