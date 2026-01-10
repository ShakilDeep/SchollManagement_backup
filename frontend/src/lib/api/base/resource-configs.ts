import { z } from 'zod'
import { ResourceConfig } from './crud-factory'
import { studentFormSchema, StudentUpdateData, sectionFormSchema } from '@/lib/validations'

export const resourceConfigs: Record<string, ResourceConfig> = {
  grade: {
    model: 'grade',
    resourceName: 'grade',
    pluralName: 'grades',
    defaultSort: 'order',
    defaultSortOrder: 'asc',
    select: {
      id: true,
      name: true,
      order: true,
    },
    transformResponse: (data: any) => ({
      id: data.id,
      name: data.name,
      order: data.order,
    }),
  },

  section: {
    model: 'section',
    resourceName: 'section',
    pluralName: 'sections',
    defaultSort: 'name',
    defaultSortOrder: 'asc',
    select: {
      id: true,
      name: true,
    },
    createSchema: sectionFormSchema,
    transformCreate: (data: any) => {
      const { grade, ...rest } = data
      return {
        ...rest,
        grade: { connect: { id: grade } },
      }
    },
  },

  student: {
    model: 'student',
    resourceName: 'student',
    pluralName: 'students',
    searchFields: ['firstName', 'lastName', 'rollNumber', 'email'],
    filterFields: {
      gradeId: { field: 'gradeId', type: 'string' },
      sectionId: { field: 'sectionId', type: 'string' },
      status: { field: 'status', type: 'string' },
    },
    defaultSort: 'createdAt',
    defaultSortOrder: 'desc',
    include: {
      grade: true,
      section: true,
      guardian: true,
    },
    createSchema: studentFormSchema,
    updateSchema: studentFormSchema.partial(),
    transformResponse: (data: any) => ({
      id: data.id,
      rollNumber: data.rollNumber,
      name: `${data.firstName} ${data.lastName}`,
      grade: data.grade?.name,
      section: data.section?.name,
      status: data.status,
      guardian: data.guardian ? `${data.guardian.firstName} ${data.guardian.lastName}` : null,
      phone: data.phone,
      admissionDate: data.admissionDate ? data.admissionDate.toISOString().split('T')[0] : null,
      avatar: data.photo || (data.firstName?.[0] + data.lastName?.[0]),
      email: data.email || '',
      address: data.address,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      medicalInfo: data.medicalConditions,
    }),
    transformCreate: (data: any) => {
      const { grade, section, guardianName, guardianPhone, relationship, firstName, lastName, email, medicalInfo, address, city, state, zipCode, dateOfBirth, ...rest } = data
      const currentYear = new Date().getFullYear()
      return {
        ...rest,
        firstName,
        lastName,
        email,
        grade: { connect: { id: grade } },
        section: { connect: { id: section } },
        admissionNumber: `${currentYear}${data.rollNumber.replace('STU', '')}`,
        dateOfBirth: new Date(dateOfBirth),
        emergencyContact: guardianName,
        emergencyPhone: guardianPhone,
        bloodGroup: 'O+',
        address,
        city,
        state,
        zipCode,
        academicYear: { connect: { id: 'cmk8kkvzt000jvqsgbv1r6o6r' } },
        guardian: { connect: { id: 'cmk5xc6jy002evqu4ljzuvkqu' } },
        user: {
          create: {
            email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`,
            name: `${firstName} ${lastName}`,
            password: 'defaultPassword123',
            role: 'STUDENT',
          },
        },
        relationship: relationship || 'Parent',
        medicalConditions: medicalInfo || null,
      }
    },
  },

  teacher: {
    model: 'teacher',
    resourceName: 'teacher',
    pluralName: 'teachers',
    searchFields: ['firstName', 'lastName', 'email', 'phone'],
    filterFields: {
      status: { field: 'status', type: 'string' },
      subject: { field: 'subject', type: 'string' },
    },
    defaultSort: 'createdAt',
    defaultSortOrder: 'desc',
    include: {
      user: true,
    },
    transformResponse: (data: any) => ({
      id: data.id,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      subject: data.subject,
      status: data.status,
      avatar: data.photo || (data.firstName?.[0] + data.lastName?.[0]),
      firstName: data.firstName,
      lastName: data.lastName,
    }),
  },

  parent: {
    model: 'parent',
    resourceName: 'parent',
    pluralName: 'parents',
    searchFields: ['firstName', 'lastName', 'email', 'phone'],
    defaultSort: 'firstName',
    defaultSortOrder: 'asc',
    include: {
      user: true,
      children: {
        include: {
          grade: true,
          section: true,
        },
      },
    },
    transformResponse: (data: any) => ({
      id: data.id,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      address: data.address,
      students: data.children?.map((s: any) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        grade: s.grade?.name,
        section: s.section?.name,
      })),
      firstName: data.firstName,
      lastName: data.lastName,
    }),
  },

  academicYear: {
    model: 'academicYear',
    resourceName: 'academicYear',
    pluralName: 'academicYears',
    defaultSort: 'startDate',
    defaultSortOrder: 'desc',
    transformResponse: (data: any) => ({
      id: data.id,
      name: data.name,
      startDate: data.startDate.toISOString().split('T')[0],
      endDate: data.endDate.toISOString().split('T')[0],
      isCurrent: data.isCurrent,
    }),
    transformCreate: (data: any) => {
      return {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      }
    },
  },
}

export function getResourceConfig(resourceName: string): ResourceConfig | undefined {
  return resourceConfigs[resourceName]
}

export function hasResourceConfig(resourceName: string): boolean {
  return resourceName in resourceConfigs
}

export function getResourceConfigByPlural(pluralName: string): ResourceConfig | undefined {
  for (const key in resourceConfigs) {
    if (resourceConfigs[key].pluralName === pluralName) {
      return resourceConfigs[key]
    }
  }
  return undefined
}
