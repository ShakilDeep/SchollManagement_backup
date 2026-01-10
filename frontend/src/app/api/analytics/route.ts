import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'overview'
    const academicYearId = searchParams.get('academicYearId')
    const sectionId = searchParams.get('sectionId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let data = {}

    switch (type) {
      case 'overview': {
        const [studentCount, teacherCount, staffCount, attendanceRate, behaviorRecords] = await Promise.all([
          db.student.count({
            where: academicYearId ? { academicYearId } : undefined,
          }),
          db.teacher.count(),
          db.staff.count(),
          db.attendance.aggregate({
            _avg: { status: true },
            where: {
              ...(academicYearId && {
                student: { academicYearId },
              }),
              ...(startDate && endDate && {
                date: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              }),
            },
          }),
          db.behaviorRecord.groupBy({
            by: ['type'],
            _count: true,
            where: {
              ...(startDate && endDate && {
                date: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              }),
            },
          }),
        ])

        data = {
          studentCount,
          teacherCount,
          staffCount,
          attendanceRate: attendanceRate._avg.status || 0,
          behaviorRecords,
        }
        break
      }

      case 'students': {
        const [studentsByGrade, studentsBySection, attendanceByGrade] = await Promise.all([
          db.student.groupBy({
            by: ['gradeId'],
            _count: true,
            where: academicYearId ? { academicYearId } : undefined,
          }),
          db.student.groupBy({
            by: ['sectionId'],
            _count: true,
            where: sectionId ? { sectionId } : undefined,
          }),
          db.attendance.groupBy({
            by: ['studentId'],
            _avg: { status: true },
            where: {
              ...(academicYearId && {
                student: { academicYearId },
              }),
              ...(startDate && endDate && {
                date: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              }),
            },
          }),
        ])

        const grades = await db.grade.findMany()
        const sections = await db.section.findMany()

        const studentsByGradeWithNames = studentsByGrade.map((s) => ({
          ...s,
          grade: grades.find((g) => g.id === s.gradeId),
        }))

        const studentsBySectionWithNames = studentsBySection.map((s) => ({
          ...s,
          section: sections.find((sec) => sec.id === s.sectionId),
        }))

        const presentCount = attendanceByGrade.filter((a) => a._avg.status >= 0.7).length
        const absentCount = attendanceByGrade.length - presentCount

        data = {
          studentsByGrade: studentsByGradeWithNames,
          studentsBySection: studentsBySectionWithNames,
          presentCount,
          absentCount,
          attendanceRate: attendanceByGrade.length > 0 ? presentCount / attendanceByGrade.length : 0,
        }
        break
      }

      case 'academics': {
        const [examResults, subjectPerformance, subjects] = await Promise.all([
          db.examResult.groupBy({
            by: ['examId'],
            _avg: { totalMarks: true, obtainedMarks: true },
            where: academicYearId ? {
              student: { academicYearId },
            } : undefined,
          }),
          db.examResult.groupBy({
            by: ['subjectId'],
            _avg: { obtainedMarks: true, totalMarks: true },
            where: academicYearId ? {
              student: { academicYearId },
            } : undefined,
          }),
          db.subject.findMany(),
        ])

        const subjectPerformanceWithNames = subjectPerformance.map((s) => ({
          ...s,
          subject: subjects.find((sub) => sub.id === s.subjectId),
        }))

        data = {
          examResults,
          subjectPerformance: subjectPerformanceWithNames,
          averagePerformance:
            examResults.length > 0
              ? examResults.reduce((acc, r) => acc + (r._avg.obtainedMarks / r._avg.totalMarks) * 100, 0) /
                examResults.length
              : 0,
        }
        break
      }

      case 'behavior': {
        const [behaviorByType, behaviorByCategory, recentIncidents] = await Promise.all([
          db.behaviorRecord.groupBy({
            by: ['type'],
            _count: true,
            _sum: { points: true },
            where: {
              ...(startDate && endDate && {
                date: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              }),
            },
          }),
          db.behaviorRecord.groupBy({
            by: ['category'],
            _count: true,
            where: {
              ...(startDate && endDate && {
                date: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              }),
            },
          }),
          db.behaviorRecord.findMany({
            where: {
              ...(startDate && endDate && {
                date: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              }),
            },
            include: {
              Student: {
                select: {
                  firstName: true,
                  lastName: true,
                  rollNumber: true,
                },
              },
            },
            orderBy: { date: 'desc' },
            take: 10,
          }),
        ])

        data = {
          behaviorByType,
          behaviorByCategory,
          recentIncidents,
        }
        break
      }

      case 'library': {
        const [totalBooks, borrowedBooks, overdueBooks, popularBooks] = await Promise.all([
          db.book.count(),
          db.libraryBorrowal.count({
            where: { returnDate: null },
          }),
          db.libraryBorrowal.count({
            where: {
              returnDate: null,
              dueDate: { lt: new Date() },
            },
          }),
          db.libraryBorrowal.groupBy({
            by: ['bookId'],
            _count: true,
            orderBy: { _count: { bookId: 'desc' } },
            take: 10,
          }),
        ])

        data = {
          totalBooks,
          borrowedBooks,
          overdueBooks,
          popularBooks,
        }
        break
      }

      case 'transport': {
        const [totalVehicles, activeAllocations, routeStats] = await Promise.all([
          db.vehicle.count(),
          db.transportAllocation.count({
            where: { status: 'ACTIVE' },
          }),
          db.transportAllocation.groupBy({
            by: ['routeId'],
            _count: true,
          }),
        ])

        data = {
          totalVehicles,
          activeAllocations,
          routeStats,
        }
        break
      }

      case 'inventory': {
        const [totalAssets, assetByCategory, assetByStatus] = await Promise.all([
          db.asset.count(),
          db.asset.groupBy({
            by: ['category'],
            _count: true,
          }),
          db.asset.groupBy({
            by: ['status'],
            _count: true,
          }),
        ])

        data = {
          totalAssets,
          assetByCategory,
          assetByStatus,
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
