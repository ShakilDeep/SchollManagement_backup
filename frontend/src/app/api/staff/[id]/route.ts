import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const teacher = await db.teacher.findFirst({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            role: true,
          },
        },
      },
    })

    if (teacher) {
      return NextResponse.json({
        id: teacher.id,
        employeeId: teacher.employeeId,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        name: `${teacher.firstName} ${teacher.lastName}`,
        type: 'Teacher' as const,
        department: teacher.department,
        designation: teacher.designation,
        status: teacher.status,
        phone: teacher.phone,
        email: teacher.email,
        joinDate: teacher.joinDate.toISOString().split('T')[0],
        userId: teacher.userId,
        gender: teacher.gender,
        dateOfBirth: teacher.dateOfBirth.toISOString().split('T')[0],
        qualification: teacher.qualification,
        specialization: teacher.specialization,
        experience: teacher.experience,
        salary: teacher.salary,
        address: teacher.address,
      })
    }

    const staff = await db.staff.findFirst({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            role: true,
          },
        },
      },
    })

    if (staff) {
      return NextResponse.json({
        id: staff.id,
        employeeId: staff.employeeId,
        firstName: staff.firstName,
        lastName: staff.lastName,
        name: `${staff.firstName} ${staff.lastName}`,
        type: 'Staff' as const,
        department: staff.department,
        designation: staff.designation,
        status: staff.status,
        phone: staff.phone,
        email: staff.email,
        joinDate: staff.joinDate.toISOString().split('T')[0],
        userId: staff.userId,
        gender: staff.gender,
        dateOfBirth: staff.dateOfBirth.toISOString().split('T')[0],
        qualification: staff.qualification,
        salary: staff.salary,
        address: staff.address,
      })
    }

    return NextResponse.json(
      { error: 'Staff member not found' },
      { status: 404 }
    )
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

    const teacher = await db.teacher.findFirst({
      where: { id },
    })

    if (teacher) {
      const updated = await db.teacher.update({
        where: { id },
        data: {
          firstName,
          lastName,
          email,
          phone,
          address,
          department,
          designation,
          status,
          qualification,
          experience: experience ? parseFloat(experience) : null,
          salary: salary ? parseFloat(salary) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
        },
      })

      return NextResponse.json({
        id: updated.id,
        employeeId: updated.employeeId,
        name: `${updated.firstName} ${updated.lastName}`,
        type: 'Teacher' as const,
        department: updated.department,
        designation: updated.designation,
        status: updated.status,
        phone: updated.phone,
        email: updated.email,
        joinDate: updated.joinDate.toISOString().split('T')[0],
        userId: updated.userId,
      })
    }

    const staff = await db.staff.findFirst({
      where: { id },
    })

    if (staff) {
      const updated = await db.staff.update({
        where: { id },
        data: {
          firstName,
          lastName,
          email,
          phone,
          address,
          department,
          designation,
          status,
          qualification,
          salary: salary ? parseFloat(salary) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
        },
      })

      return NextResponse.json({
        id: updated.id,
        employeeId: updated.employeeId,
        name: `${updated.firstName} ${updated.lastName}`,
        type: 'Staff' as const,
        department: updated.department,
        designation: updated.designation,
        status: updated.status,
        phone: updated.phone,
        email: updated.email,
        joinDate: updated.joinDate.toISOString().split('T')[0],
        userId: updated.userId,
      })
    }

    return NextResponse.json(
      { error: 'Staff member not found' },
      { status: 404 }
    )
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

    const teacher = await db.teacher.findFirst({
      where: { id },
    })

    if (teacher) {
      await db.teacher.delete({
        where: { id },
      })

      if (teacher.userId) {
        await db.user.delete({
          where: { id: teacher.userId },
        }).catch(() => {
        })
      }

      return NextResponse.json({ success: true })
    }

    const staff = await db.staff.findFirst({
      where: { id },
    })

    if (staff) {
      await db.staff.delete({
        where: { id },
      })

      if (staff.userId) {
        await db.user.delete({
          where: { id: staff.userId },
        }).catch(() => {
        })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Staff member not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error deleting staff member:', error)
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    )
  }
}
