
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const student = await db.student.findUnique({
      where: { id },
      include: {
        grade: true,
        section: true,
        guardian: true,
      },
    })

    if (!student) {
      return new NextResponse('Student not found', { status: 404 })
    }

    const formattedStudent = {
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
    }

    return NextResponse.json(formattedStudent)
  } catch (error) {
    console.error('[STUDENT_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      status,
      rollNumber
    } = body

    // We need to resolve grade/section again if they changed
    let gradeId = undefined
    let sectionId = undefined

    if (grade) {
      const gradeRecord = await db.grade.findFirst({ where: { name: grade } })
      if (gradeRecord) {
        gradeId = gradeRecord.id
        // Only update section if grade is valid and section is provided
        if (section) {
            const sectionRecord = await db.section.findFirst({ where: { name: section, gradeId: gradeRecord.id } })
            if (sectionRecord) sectionId = sectionRecord.id
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      phone,
      email,
      address,
      status,
      rollNumber
    }

    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (gradeId) updateData.gradeId = gradeId
    if (sectionId) updateData.sectionId = sectionId

    // Update student
    const student = await db.student.update({
      where: { id },
      data: updateData,
    })
    
    // Update guardian if needed? (Skipping for now to keep simple, usually guardian is a separate entity update)

    return NextResponse.json(student)
  } catch (error) {
    console.error('[STUDENT_PUT]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if exists
    const student = await db.student.findUnique({ where: { id } })
    if (!student) return new NextResponse('Not Found', { status: 404 })

    // Delete student (and cascade deletes might happen if configured, otherwise we might leave orphan user)
    // In schema: user -> student is on delete cascade?
    // Student model: user User @relation(fields: [userId], references: [id], onDelete: Cascade)
    // Wait, `Student` holds the foreign key `userId`.
    // So deleting `Student` does NOT delete `User`.
    // But deleting `User` deletes `Student`.
    // We should probably delete the User associated with the Student if we want a clean removal.
    
    await db.user.delete({
        where: { id: student.userId }
    })
    // This cascades to Student.

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[STUDENT_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
