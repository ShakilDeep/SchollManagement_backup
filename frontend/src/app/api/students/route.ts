
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rollNumber = searchParams.get('rollNumber')

    if (rollNumber) {
      const student = await db.student.findFirst({
        where: { rollNumber },
        include: {
          grade: true,
          section: true,
          guardian: true,
        },
      })

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      return NextResponse.json({
        id: student.id,
        rollNumber: student.rollNumber,
        name: `${student.firstName} ${student.lastName}`,
        grade: student.grade.name,
        section: student.section.name,
        status: student.status,
        guardian: `${student.guardian.firstName} ${student.guardian.lastName}`,
        phone: student.phone,
        admissionDate: student.admissionDate.toISOString().split('T')[0],
        avatar: student.photo || (student.firstName[0] + student.lastName[0]),
        email: student.email || '',
        address: student.address,
      })
    }

    const students = await db.student.findMany({
      include: {
        grade: true,
        section: true,
        guardian: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedStudents = students.map((student) => ({
      id: student.id,
      rollNumber: student.rollNumber,
      name: `${student.firstName} ${student.lastName}`,
      grade: student.grade.name,
      section: student.section.name,
      status: student.status,
      guardian: `${student.guardian.firstName} ${student.guardian.lastName}`,
      phone: student.phone,
      admissionDate: student.admissionDate.toISOString().split('T')[0],
      avatar: student.photo || (student.firstName[0] + student.lastName[0]),
      email: student.email || '',
      address: student.address,
    }))

    return NextResponse.json(formattedStudents)
  } catch (error) {
    console.error('[STUDENTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      grade,
      section,
      guardianName,
      guardianPhone,
      rollNumber,
      status,
    } = body

    // Simple validation
    if (!firstName || !lastName || !rollNumber) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Find or create dependencies (simplified for this task)
    // In a real app, you'd select from dropdowns that return IDs.
    // Here we'll try to find existing Grade/Section or fallback/error.

    const gradeRecord = await db.grade.findFirst({
      where: { name: grade },
    })

    if (!gradeRecord) {
      return new NextResponse('Invalid Grade', { status: 400 })
    }

    let sectionRecord = await db.section.findFirst({
      where: { name: section, gradeId: gradeRecord.id },
    })

    // If section doesn't exist for this grade, maybe create it or error?
    // For now, let's error if strict, or just pick first available if not found?
    // Let's assume the frontend sends valid data matching our seed.
    if (!sectionRecord) {
       return new NextResponse('Invalid Section', { status: 400 })
    }

    // Handle User creation (every student needs a user)
    const user = await db.user.create({
      data: {
        email: email || `student-${rollNumber}@school.com`, // Fallback email
        name: `${firstName} ${lastName}`,
        role: 'STUDENT',
        password: 'password123',
      },
    })

    // Handle Guardian
    // Simplification: Check if guardian exists by phone, else create
    let guardian = await db.parent.findFirst({
      where: { phone: guardianPhone },
    })

    if (!guardian) {
      // Create parent user first
      const parentUser = await db.user.create({
        data: {
          email: `parent-${guardianPhone}@school.com`,
          name: guardianName,
          role: 'PARENT',
          password: 'password123',
        },
      })

      guardian = await db.parent.create({
        data: {
          userId: parentUser.id,
          firstName: guardianName.split(' ')[0],
          lastName: guardianName.split(' ').slice(1).join(' ') || '',
          phone: guardianPhone,
        },
      })
    }

    // Get current academic year
    const academicYear = await db.academicYear.findFirst({
      where: { isCurrent: true },
    })

    if (!academicYear) {
      return new NextResponse('No active academic year found', { status: 500 })
    }

    const student = await db.student.create({
      data: {
        userId: user.id,
        rollNumber,
        admissionNumber: `ADM-${rollNumber}`,
        firstName,
        lastName,
        gender: 'Not Specified',
        dateOfBirth: new Date('2010-01-01'), // Default
        phone: phone || '',
        email: email || '',
        address: address || '',
        city: 'Springfield',
        state: 'IL',
        zipCode: '00000',
        emergencyContact: guardianName,
        emergencyPhone: guardianPhone,
        gradeId: gradeRecord.id,
        sectionId: sectionRecord.id,
        academicYearId: academicYear.id,
        guardianId: guardian.id,
        relationship: 'Parent',
        status: status || 'Active',
      },
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error('[STUDENTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
