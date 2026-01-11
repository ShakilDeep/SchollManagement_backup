import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Currency = 'BDT' | 'USD' | 'EUR' | 'GBP' | 'INR'

export interface CurrencyFormatOptions {
  currency?: Currency
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export function formatCurrency(
  amount: number | string,
  options: CurrencyFormatOptions = {}
): string {
  const {
    currency = 'BDT',
    locale = 'en-BD',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(numericAmount)) {
    return '৳0'
  }

  const currencySymbols: Record<Currency, string> = {
    BDT: '৳',
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹'
  }

  const localeMap: Record<Currency, string> = {
    BDT: 'en-BD',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    INR: 'en-IN'
  }

  const formatter = new Intl.NumberFormat(localeMap[currency] || locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits,
    maximumFractionDigits
  })

  return formatter.format(numericAmount)
}
