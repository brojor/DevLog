import type { DateInput } from '../types/notion'

/**
 * Converts a date in various formats to an ISO 8601 string
 * @param date Input date as a Date object, ISO 8601 string, nebo unix timestamp (number)
 * @returns Datum ve formátu ISO 8601 string
 * @throws Error pokud vstup není validní datum
 */
export function convertToISO8601(date: DateInput): string {
  try {
    let dateObject: Date

    if (date instanceof Date) {
      dateObject = date
    }
    else if (typeof date === 'string') {
      dateObject = new Date(date)
    }
    else if (typeof date === 'number') {
      const isSecondsTimestamp = date < 10000000000
      dateObject = new Date(isSecondsTimestamp ? date * 1000 : date)
    }
    else {
      throw new TypeError('Neplatný typ data. Očekáván je Date, string nebo number.')
    }

    if (Number.isNaN(dateObject.getTime())) {
      throw new TypeError('Nepodařilo se převést vstup na validní datum.')
    }

    return dateObject.toISOString()
  }
  catch (error) {
    throw new Error(`Chyba při převodu data: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
  }
}
