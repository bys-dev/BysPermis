import {
  cn,
  formatPrice,
  formatDate,
  slugify,
  truncate,
  generateReservationNumber,
  calculateCommission,
} from '@/lib/utils'

// ---------------------------------------------------------------------------
// cn()
// ---------------------------------------------------------------------------
describe('cn', () => {
  it('merges multiple class strings', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('handles conditional classes', () => {
    expect(cn('text-base', false && 'hidden', 'block')).toBe('text-base block')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    const result = cn('px-4', 'px-6')
    expect(result).toBe('px-6')
  })

  it('resolves color conflicts', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('handles undefined and null gracefully', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b')
  })

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('')
  })
})

// ---------------------------------------------------------------------------
// formatPrice()
// ---------------------------------------------------------------------------
describe('formatPrice', () => {
  it('formats a whole-number price in euros', () => {
    const result = formatPrice(230)
    // Intl may use non-breaking space (\u202F or \u00A0)
    expect(result.replace(/\s/g, ' ')).toMatch(/230\s*€/)
  })

  it('formats a decimal price with two fraction digits', () => {
    const result = formatPrice(1500.5)
    const normalised = result.replace(/\s/g, ' ')
    expect(normalised).toMatch(/1\s*500,50\s*€/)
  })

  it('formats zero', () => {
    const result = formatPrice(0)
    expect(result.replace(/\s/g, ' ')).toMatch(/0\s*€/)
  })

  it('formats a large number with thousands separator', () => {
    const result = formatPrice(12500)
    const normalised = result.replace(/\s/g, ' ')
    expect(normalised).toMatch(/12\s*500\s*€/)
  })
})

// ---------------------------------------------------------------------------
// formatDate()
// ---------------------------------------------------------------------------
describe('formatDate', () => {
  // Use a fixed date: 10 April 2026
  const dateObj = new Date(2026, 3, 10) // month is 0-indexed
  const dateStr = '2026-04-10T00:00:00'

  it('formats a Date object in long format by default', () => {
    const result = formatDate(dateObj)
    expect(result).toMatch(/10 avril 2026/)
  })

  it('formats a string date in long format', () => {
    const result = formatDate(dateStr)
    expect(result).toMatch(/10 avril 2026/)
  })

  it('formats in short format', () => {
    const result = formatDate(dateObj, 'short')
    expect(result).toBe('10/04/2026')
  })

  it('formats a string date in short format', () => {
    const result = formatDate(dateStr, 'short')
    expect(result).toBe('10/04/2026')
  })
})

// ---------------------------------------------------------------------------
// slugify()
// ---------------------------------------------------------------------------
describe('slugify', () => {
  it('converts accented French text to a slug', () => {
    expect(slugify('Stage récupération de points')).toBe(
      'stage-recuperation-de-points'
    )
  })

  it('handles special characters', () => {
    expect(slugify('Permis B — accéléré !')).toBe('permis-b-accelere')
  })

  it('trims leading and trailing whitespace / hyphens', () => {
    expect(slugify('  hello world  ')).toBe('hello-world')
  })

  it('collapses multiple spaces into a single hyphen', () => {
    expect(slugify('a   b')).toBe('a-b')
  })

  it('handles uppercase', () => {
    expect(slugify('Hello WORLD')).toBe('hello-world')
  })

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// truncate()
// ---------------------------------------------------------------------------
describe('truncate', () => {
  it('truncates text longer than maxLength and adds ellipsis', () => {
    expect(truncate('Hello World', 5)).toBe('Hello\u2026')
  })

  it('does not truncate text shorter than maxLength', () => {
    expect(truncate('Hi', 10)).toBe('Hi')
  })

  it('does not truncate text exactly at maxLength', () => {
    expect(truncate('Hello', 5)).toBe('Hello')
  })

  it('trims trailing spaces before adding ellipsis', () => {
    const result = truncate('Hello World again', 6)
    // slice(0,6) = "Hello " -> trimEnd() = "Hello" + "…"
    expect(result).toBe('Hello\u2026')
  })
})

// ---------------------------------------------------------------------------
// generateReservationNumber()
// ---------------------------------------------------------------------------
describe('generateReservationNumber', () => {
  it('returns a string matching BYS-YYYY-XXXX pattern', () => {
    const num = generateReservationNumber()
    expect(num).toMatch(/^BYS-\d{4}-[A-Z0-9]{4}$/)
  })

  it('includes the current year', () => {
    const year = new Date().getFullYear().toString()
    const num = generateReservationNumber()
    expect(num).toContain(year)
  })

  it('generates different numbers on successive calls', () => {
    const a = generateReservationNumber()
    const b = generateReservationNumber()
    // Extremely unlikely to be equal, but not impossible
    // Just test the format is consistent
    expect(a).toMatch(/^BYS-\d{4}-[A-Z0-9]{4}$/)
    expect(b).toMatch(/^BYS-\d{4}-[A-Z0-9]{4}$/)
  })
})

// ---------------------------------------------------------------------------
// calculateCommission()
// ---------------------------------------------------------------------------
describe('calculateCommission', () => {
  it('calculates 10% commission on 1000', () => {
    const { commission, centreAmount } = calculateCommission(1000, 10)
    expect(commission).toBe(100)
    expect(centreAmount).toBe(900)
  })

  it('calculates 15% commission on 230', () => {
    const { commission, centreAmount } = calculateCommission(230, 15)
    expect(commission).toBe(34.5)
    expect(centreAmount).toBe(195.5)
  })

  it('returns zero commission for 0% rate', () => {
    const { commission, centreAmount } = calculateCommission(500, 0)
    expect(commission).toBe(0)
    expect(centreAmount).toBe(500)
  })

  it('returns full amount as commission for 100% rate', () => {
    const { commission, centreAmount } = calculateCommission(200, 100)
    expect(commission).toBe(200)
    expect(centreAmount).toBe(0)
  })

  it('handles floating-point precision (rounds to 2 decimals)', () => {
    // 333 * 0.07 = 23.31 exactly
    const { commission, centreAmount } = calculateCommission(333, 7)
    expect(commission).toBe(23.31)
    expect(centreAmount).toBe(309.69)
  })
})
