import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const department = searchParams.get('department')
    const status = searchParams.get('status')

    const teachers = await db.teacher.findMany({
      where: {
        status: status || undefined,
        ...(search && {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { employeeId: { contains: search } },
            { email: { contains: search } },
            { user: { email: { contains: search } } },
          ],
        }),
        ...(department && { department: { contains: department } }),
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

    const staff = await db.staff.findMany({
      where: {
        status: status || undefined,
        ...(search && {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { employeeId: { contains: search } },
            { email: { contains: search } },
            { user: { email: { contains: search } } },
          ],
        }),
        ...(department && { department: { contains: department } }),
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

    const combinedStaff = [
      ...teachers.map((teacher) => ({
        id: teacher.id,
        employeeId: teacher.employeeId,
        name: `${teacher.firstName} ${teacher.lastName}`,
        type: 'Teacher' as const,
        department: teacher.department,
        designation: teacher.designation,
        status: teacher.status,
        phone: teacher.phone,
        email: teacher.email,
        joinDate: teacher.joinDate.toISOString().split('T')[0],
        userId: teacher.userId,
      })),
      ...staff.map((s) => ({
        id: s.id,
        employeeId: s.employeeId,
        name: `${s.firstName} ${s.lastName}`,
        type: 'Staff' as const,
        department: s.department,
        designation: s.designation,
        status: s.status,
        phone: s.phone,
        email: s.email,
        joinDate: s.joinDate.toISOString().split('T')[0],
        userId: s.userId,
      })),
    ]

    const filtered = type ? combinedStaff.filter((s) => s.type === type) : combinedStaff

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

    const employeeId = `EMP-${Date.now().toString().slice(-6)}`

    const user = await db.user.create({
      data: {
        email,
        password: null,
        name: `${firstName} ${lastName}`,
        role: type === 'Teacher' ? 'TEACHER' : 'STAFF',
        phone,
        address,
      },
    })

    let result

    if (type === 'Teacher') {
      result = await db.teacher.create({
        data: {
          userId: user.id,
          employeeId,
          firstName,
          lastName,
          gender,
          dateOfBirth: new Date(dateOfBirth),
          phone,
          email,
          address,
          department,
          designation,
          qualification,
          experience: experience ? parseFloat(experience) : null,
          salary: salary ? parseFloat(salary) : null,
          joinDate: new Date(),
          status: 'Active',
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
    } else {
      result = await db.staff.create({
        data: {
          userId: user.id,
          employeeId,
          firstName,
          lastName,
          gender,
          dateOfBirth: new Date(dateOfBirth),
          phone,
          email,
          address,
          department,
          designation,
          qualification,
          salary: salary ? parseFloat(salary) : null,
          joinDate: new Date(),
          status: 'Active',
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
    }

    const responseData = {
      id: result.id,
      employeeId: result.employeeId,
      name: `${result.firstName} ${result.lastName}`,
      type: type as 'Teacher' | 'Staff',
      department: result.department,
      designation: result.designation,
      status: result.status,
      phone: result.phone,
      email: result.email,
      joinDate: result.joinDate.toISOString().split('T')[0],
      userId: result.userId,
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
