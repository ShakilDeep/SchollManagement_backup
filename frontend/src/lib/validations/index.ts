export { createSchemaBuilder, commonValidations, formFieldTypes } from './schema-builder'
export type { SchemaBuilderConfig } from './schema-builder'

export {
  studentFormSchema,
  staffFormSchema,
  attendanceFormSchema,
  attendanceFilterSchema,
  attendanceStatusSchema,
  examSchema,
  examPaperSchema,
  bookSchema,
  behaviorRecordSchema,
  curriculumFormSchema,
  lessonFormSchema,
  sectionFormSchema,
} from './schemas'

export type {
  StudentFormData,
  StudentUpdateData,
  StaffFormData,
  AttendanceFormData,
  AttendanceFilterData,
  AttendanceStatus,
  ExamInput,
  ExamPaperInput,
  BookInput,
  BehaviorRecordInput,
  CreateCurriculumFormData,
  EditCurriculumFormData,
  LessonFormData,
  SectionFormData,
} from './schemas'
