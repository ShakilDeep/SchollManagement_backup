import React from 'react'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import type { UseFormReturn, FieldValues } from 'react-hook-form'

interface FormProps<T extends FieldValues> extends UseFormReturn<T> {
  children: React.ReactNode
  onSubmit?: (data: T) => void | Promise<void>
  className?: string
}

function Form<T extends FieldValues>({ children, onSubmit, className, ...form }: FormProps<T>) {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit || (() => {}))} className={className}>
        {children}
      </form>
    </FormProvider>
  )
}

export { Form, useForm, useFormContext }
export type { FieldValues, UseFormReturn }
