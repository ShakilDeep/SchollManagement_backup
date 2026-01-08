import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const academicYears = await prisma.academicYear.findMany({
      orderBy: [
        { isCurrent: 'desc' },
        { startDate: 'desc' }
      ]
    })

    return NextResponse.json(academicYears)
  } catch (error) {
    console.error('Error fetching academic years:', error)
    return NextResponse.json({ error: 'Failed to fetch academic years' }, { status: 500 })
  }
}
