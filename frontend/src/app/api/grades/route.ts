import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const grades = await db.grade.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, name: true }
    })
    return NextResponse.json(grades)
  } catch (error) {
    console.error('[GRADES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
