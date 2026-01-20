import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const staffMember = await fetchAPI<any>(`/staff/${id}/`)

    return NextResponse.json({
      id: staffMember.id,
      employeeId: staffMember.employee_id || staffMember.employeeId,
      firstName: staffMember.first_name || staffMember.firstName,
      lastName: staffMember.last_name || staffMember.lastName,
      name: `${staffMember.first_name || staffMember.firstName} ${staffMember.last_name || staffMember.lastName}`,
      type: staffMember.type || 'Staff',
      department: staffMember.department,
      designation: staffMember.designation,
      status: staffMember.status || 'Active',
      phone: staffMember.phone,
      email: staffMember.email,
      joinDate: staffMember.join_date || staffMember.joinDate,
      userId: staffMember.user || staffMember.userId,
      gender: staffMember.gender,
      dateOfBirth: staffMember.date_of_birth || staffMember.dateOfBirth,
      qualification: staffMember.qualification,
      specialization: staffMember.specialization,
      experience: staffMember.experience,
      salary: staffMember.salary,
      address: staffMember.address,
    })
  } catch (error) {
    console.error('Error fetching staff member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff member' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      status,
      qualification,
      address,
      experience,
      salary,
    } = body

    const updated = await fetchAPI(`/staff/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        address,
        department,
        designation,
        status,
        qualification,
        experience: experience ? parseFloat(experience) : null,
        salary: salary ? parseFloat(salary) : null,
      })
    })

    return NextResponse.json({
      id: updated.id,
      employeeId: updated.employee_id || updated.employeeId,
      name: `${updated.first_name || updated.firstName} ${updated.last_name || updated.lastName}`,
      type: updated.type,
      department: updated.department,
      designation: updated.designation,
      status: updated.status,
      phone: updated.phone,
      email: updated.email,
      joinDate: updated.join_date || updated.joinDate,
      userId: updated.user || updated.userId,
    })
  } catch (error) {
    console.error('Error updating staff member:', error)
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await fetchAPI(`/staff/${id}/`, {
      method: 'DELETE'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting staff member:', error)
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    )
  }
}
