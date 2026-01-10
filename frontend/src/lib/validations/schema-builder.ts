import { z } from 'zod'

type FieldBuilder<T extends z.ZodTypeAny> = {
  optional: () => FieldBuilder<z.ZodOptional<T>>
  nullable: () => FieldBuilder<z.ZodNullable<T>>
  default: (value: z.infer<T>) => FieldBuilder<z.ZodDefault<z.ZodOptional<T>>>
  refine: <U extends z.ZodTypeAny>(
    check: (val: z.infer<T>) => boolean,
    message: string | { path: string[]; message: string }[]
  ) => FieldBuilder<z.ZodEffects<T, z.infer<T>, z.infer<T>>>
  transform: <U>(fn: (val: z.infer<T>) => U) => FieldBuilder<z.ZodEffects<T, U, z.infer<T>>>
  pipe: <U extends z.ZodTypeAny>(schema: U) => FieldBuilder<z.ZodPipeline<T, U>>
  describe: (description: string) => FieldBuilder<T>
  build: () => T
}

type SchemaBuilderConfig<T extends Record<string, any>> = {
  create?: boolean
  update?: boolean
  partial?: boolean
}

class SchemaBuilder<T extends Record<string, any>> {
  private schema: z.ZodObject<z.ZodRawShape, 'strip', z.ZodTypeAny, T, T>
  private fields: Map<string, z.ZodTypeAny> = new Map()

  constructor() {
    this.schema = z.object({})
  }

  string(fieldName: keyof T & string): FieldBuilder<z.ZodString> {
    const field = z.string()
    this.fields.set(fieldName, field)
    return this.wrapField<z.ZodString>(fieldName, field)
  }

  number(fieldName: keyof T & string): FieldBuilder<z.ZodNumber> {
    const field = z.number()
    this.fields.set(fieldName, field)
    return this.wrapField<z.ZodNumber>(fieldName, field)
  }

  boolean(fieldName: keyof T & string): FieldBuilder<z.ZodBoolean> {
    const field = z.boolean()
    this.fields.set(fieldName, field)
    return this.wrapField<z.ZodBoolean>(fieldName, field)
  }

  date(fieldName: keyof T & string): FieldBuilder<z.ZodDate> {
    const field = z.date()
    this.fields.set(fieldName, field)
    return this.wrapField<z.ZodDate>(fieldName, field)
  }

  email(fieldName: keyof T & string): FieldBuilder<z.ZodString> {
    const field = z.string().email()
    this.fields.set(fieldName, field)
    return this.wrapField<z.ZodString>(fieldName, field)
  }

  url(fieldName: keyof T & string): FieldBuilder<z.ZodString> {
    const field = z.string().url()
    this.fields.set(fieldName, field)
    return this.wrapField<z.ZodString>(fieldName, field)
  }

  uuid(fieldName: keyof T & string): FieldBuilder<z.ZodString> {
    const field = z.string().uuid()
    this.fields.set(fieldName, field)
    return this.wrapField<z.ZodString>(fieldName, field)
  }

  enum<U extends readonly [string, ...string[]]>(
    fieldName: keyof T & string,
    values: U
  ): FieldBuilder<z.ZodEnum<U>> {
    const field = z.enum(values)
    this.fields.set(fieldName, field)
    return this.wrapField<z.ZodEnum<U>>(fieldName, field)
  }

  array<U extends z.ZodTypeAny>(
    fieldName: keyof T & string,
    schema: U
  ): FieldBuilder<z.ZodArray<U>> {
    const field = z.array(schema)
    this.fields.set(fieldName, field)
    return this.wrapField<z.ZodArray<U>>(fieldName, field)
  }

  object<U extends Record<string, any>>(
    fieldName: keyof T & string,
    schema: z.ZodObject<z.ZodRawShape>
  ): FieldBuilder<z.ZodObject<z.ZodRawShape>> {
    this.fields.set(fieldName, schema)
    return this.wrapField<z.ZodObject<z.ZodRawShape>>(fieldName, schema)
  }

  custom<U extends z.ZodTypeAny>(
    fieldName: keyof T & string,
    schema: U
  ): FieldBuilder<U> {
    this.fields.set(fieldName, schema)
    return this.wrapField<U>(fieldName, schema)
  }

  private wrapField<U extends z.ZodTypeAny>(
    fieldName: string,
    schema: U
  ): FieldBuilder<U> {
    const builder = {
      optional: () => {
        const optionalSchema = schema.optional() as any
        this.fields.set(fieldName, optionalSchema)
        return builder
      },
      nullable: () => {
        const nullableSchema = schema.nullable() as any
        this.fields.set(fieldName, nullableSchema)
        return builder
      },
      default: (value: any) => {
        const defaultSchema = schema.optional().default(value) as any
        this.fields.set(fieldName, defaultSchema)
        return builder
      },
      refine: (check: any, message: any) => {
        const refinedSchema = schema.refine(check, message) as any
        this.fields.set(fieldName, refinedSchema)
        return builder
      },
      transform: (fn: any) => {
        const transformedSchema = schema.transform(fn) as any
        this.fields.set(fieldName, transformedSchema)
        return builder
      },
      pipe: (pipelineSchema: any) => {
        const pipedSchema = schema.pipe(pipelineSchema) as any
        this.fields.set(fieldName, pipedSchema)
        return builder
      },
      describe: (description: string) => {
        const describedSchema = schema.describe(description) as any
        this.fields.set(fieldName, describedSchema)
        return builder
      },
      build: () => schema,
    }
    return builder as FieldBuilder<U>
  }

  build(config: SchemaBuilderConfig<T> = {}): z.ZodSchema<T> {
    const shape = Object.fromEntries(this.fields.entries()) as z.ZodRawShape
    let schema = z.object(shape)

    if (config.partial) {
      schema = schema.partial() as any
    }

    if (config.create) {
      const requiredFields = Array.from(this.fields.entries())
        .filter(([_, field]) => {
          const unwrapped = field instanceof z.ZodOptional || field instanceof z.ZodDefault || field instanceof z.ZodNullable
          return !unwrapped
        })
        .map(([name]) => name)

      schema = schema.partial() as any
      requiredFields.forEach((field) => {
        schema = (schema as any).required({ [field]: true })
      })
    }

    return schema
  }

  buildCreate(): z.ZodSchema<T> {
    return this.build({ create: true })
  }

  buildUpdate(): z.ZodSchema<Partial<T>> {
    return this.build({ partial: true }) as z.ZodSchema<Partial<T>>
  }
}

export function createSchemaBuilder<T extends Record<string, any>>() {
  return new SchemaBuilder<T>()
}

export const commonValidations = {
  required: (message?: string) => z.string().min(1, { message: message || 'This field is required' }),
  minLength: (min: number, message?: string) => z.string().min(min, { message: message || `Minimum ${min} characters` }),
  maxLength: (max: number, message?: string) => z.string().max(max, { message: message || `Maximum ${max} characters` }),
  min: (min: number, message?: string) => z.number().min(min, { message: message || `Minimum value is ${min}` }),
  max: (max: number, message?: string) => z.number().max(max, { message: message || `Maximum value is ${max}` }),
  positive: (message?: string) => z.number().positive({ message: message || 'Must be positive' }),
  nonnegative: (message?: string) => z.number().nonnegative({ message: message || 'Must be non-negative' }),
  integer: (message?: string) => z.number().int({ message: message || 'Must be an integer' }),
  email: (message?: string) => z.string().email({ message: message || 'Invalid email address' }),
  url: (message?: string) => z.string().url({ message: message || 'Invalid URL' }),
  uuid: (message?: string) => z.string().uuid({ message: message || 'Invalid UUID' }),
  phone: (message?: string) => z.string().regex(/^\+?[\d\s-()]+$/, { message: message || 'Invalid phone number' }),
  date: (message?: string) => z.coerce.date({ message: message || 'Invalid date' }),
  futureDate: (message?: string) => z.coerce.date().refine((d) => d > new Date(), { message: message || 'Date must be in the future' }),
  pastDate: (message?: string) => z.coerce.date().refine((d) => d < new Date(), { message: message || 'Date must be in the past' }),
  password: (minLength: number = 8) =>
    z
      .string()
      .min(minLength, { message: `Password must be at least ${minLength} characters` })
      .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
      .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  slug: (message?: string) => z.string().regex(/^[a-z0-9-]+$/, { message: message || 'Invalid slug format' }),
  alphanumeric: (message?: string) => z.string().regex(/^[a-zA-Z0-9]+$/, { message: message || 'Must be alphanumeric' }),
  hexColor: (message?: string) => z.string().regex(/^#?[0-9A-Fa-f]{6}$/, { message: message || 'Invalid hex color' }),
  postalCode: (country: string = 'US') => {
    const patterns: Record<string, RegExp> = {
      US: /^\d{5}(-\d{4})?$/,
      UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
      CA: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
      DE: /^\d{5}$/,
    }
    return z.string().regex(patterns[country] || patterns.US, { message: 'Invalid postal code' })
  },
}

export const formFieldTypes = {
  text: (field: string) => z.string(),
  textarea: (field: string) => z.string(),
  email: (field: string) => z.string().email(),
  password: (field: string) => z.string().min(8),
  number: (field: string) => z.number(),
  date: (field: string) => z.coerce.date(),
  select: (field: string, options: string[]) => z.enum(options as [string, ...string[]]),
  checkbox: (field: string) => z.boolean(),
  radio: (field: string, options: string[]) => z.enum(options as [string, ...string[]]),
  file: (field: string, allowedTypes: string[] = ['image/*', 'application/pdf']) => z.any(),
  multiSelect: (field: string, options: string[]) => z.array(z.enum(options as [string, ...string[]])),
}
