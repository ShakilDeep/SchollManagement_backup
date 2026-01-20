import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const department = searchParams.get('department')
    const status = searchParams.get('status')

    // Build query parameters for backend API
    const queryParams: Record<string, string> = {}
    if (search) queryParams.search = search
    if (type) queryParams.type = type
    if (department) queryParams.department = department
    if (status) queryParams.status = status

    const response = await fetchAPI<{ results: any[] }>('/staff/', { query: queryParams })
    const staffMembers = response.results || []

    const transformedStaff = staffMembers.map((s: any) => ({
      id: s.id,
      employeeId: s.employee_id || s.employeeId || '',
      name: `${s.first_name || s.firstName || ''} ${s.last_name || s.lastName || ''}`.trim() || 'Unknown',
      type: s.type || 'Staff',
      department: s.department,
      designation: s.designation,
      status: s.status || 'Active',
      phone: s.phone,
      email: s.email,
      joinDate: s.join_date || s.joinDate || new Date().toISOString().split('T')[0],
      userId: s.user || s.userId,
      firstName: s.first_name || s.firstName,
      lastName: s.last_name || s.lastName,
    }))

    const filtered = type ? transformedStaff.filter((s) => s.type === type) : transformedStaff

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      type,
      department,
      designation,
      gender,
      dateOfBirth,
      qualification,
      address,
      experience,
      salary,
    } = body

    if (!firstName || !lastName || !email || !phone || !type || !department || !designation || !gender || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const staffMember = await fetchAPI('/staff/', {
      method: 'POST',
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        type,
        department,
        designation,
        gender,
        date_of_birth: dateOfBirth,
        qualification,
        address,
        experience: experience ? parseFloat(experience) : null,
        salary: salary ? parseFloat(salary) : null,
      })
    })

    const responseData = {
      id: staffMember.id,
      employeeId: staffMember.employee_id || staffMember.employeeId,
      name: `${staffMember.first_name || staffMember.firstName} ${staffMember.last_name || staffMember.lastName}`,
      type: staffMember.type || type,
      department: staffMember.department,
      designation: staffMember.designation,
      status: staffMember.status,
      phone: staffMember.phone,
      email: staffMember.email,
      joinDate: staffMember.join_date || staffMember.joinDate,
      userId: staffMember.user || staffMember.userId,
    }

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    )
  }
}
