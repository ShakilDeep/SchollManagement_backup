import { NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET() {
  try {
    const response = await fetchAPI<{ results: any[] }>('/curriculum/subjects/')
    const subjects = (response.results || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      description: s.description,
      gradeLevel: s.grade_level || s.gradeLevel
    }))
    return NextResponse.json(subjects)
  } catch (error) {
    console.error('Error fetching subjects from backend API:', error)
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}
