import { cache } from 'react'
import { db } from '@/lib/db'

export const getCurriculums = cache(async (filters?: {
  subjectId?: string
  gradeId?: string
  academicYearId?: string
}) => {
  const where: any = {}
  if (filters?.subjectId) where.subjectId = filters.subjectId
  if (filters?.gradeId) where.gradeId = filters.gradeId
  if (filters?.academicYearId) where.academicYearId = filters.academicYearId

  const curriculums = await db.curriculum.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      objectives: true,
      topics: true,
      createdAt: true,
      updatedAt: true,
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          color: true
        }
      },
      grade: {
        select: {
          id: true,
          name: true
        }
      },
      academicYear: {
        select: {
          id: true,
          name: true
        }
      },
      lessons: {
        select: {
          id: true,
          title: true,
          content: true,
          date: true,
          duration: true,
          status: true,
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  return curriculums
})

export const getCurriculumById = cache(async (id: string) => {
  const curriculum = await db.curriculum.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      objectives: true,
      topics: true,
      createdAt: true,
      updatedAt: true,
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          color: true
        }
      },
      grade: {
        select: {
          id: true,
          name: true
        }
      },
      academicYear: {
        select: {
          id: true,
          name: true
        }
      },
      lessons: {
        select: {
          id: true,
          title: true,
          content: true,
          date: true,
          duration: true,
          status: true,
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      }
    }
  })

  return curriculum
})

export const getSubjects = cache(async () => {
  const subjects = await db.subject.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      color: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return subjects
})

export const getGrades = cache(async () => {
  const grades = await db.grade.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return grades
})

export const getAcademicYears = cache(async () => {
  const academicYears = await db.academicYear.findMany({
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      isCurrent: true
    },
    orderBy: {
      startDate: 'desc'
    }
  })

  return academicYears
})
