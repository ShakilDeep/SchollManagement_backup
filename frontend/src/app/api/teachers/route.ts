import { NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET() {
  try {
    const response = await fetchAPI<{ results: any[] }>('/staff/')
    const teachers = (response.results || []).map((t: any) => ({
      id: t.id,
      firstName: t.first_name || t.firstName,
      lastName: t.last_name || t.lastName,
      fullName: `${t.first_name || t.firstName} ${t.last_name || t.lastName}`,
      email: t.email,
      phone: t.phone,
      type: t.type,
      subject: t.subject,
      status: t.status,
      employeeId: t.employee_id || t.employeeId
    }))
    return NextResponse.json(teachers)
  } catch (error) {
    console.error('Error fetching teachers from backend API:', error)
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
  }
}
