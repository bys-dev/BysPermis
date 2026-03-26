import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Qualiopi</Badge>)
    expect(screen.getByText('Qualiopi')).toBeInTheDocument()
  })

  it('applies the default variant class when no variant is provided', () => {
    const { container } = render(<Badge>Default</Badge>)
    const span = container.querySelector('span')!
    expect(span.className).toContain('badge')
    expect(span.className).toContain('bg-gray-100')
    expect(span.className).toContain('text-gray-600')
  })

  it.each([
    ['qualiopi', 'badge-qualiopi'],
    ['cpf', 'badge-cpf'],
    ['success', 'badge-success'],
    ['warning', 'badge-warning'],
    ['danger', 'badge-danger'],
    ['info', 'badge-info'],
  ] as const)('applies correct class for variant "%s"', (variant, expectedClass) => {
    const { container } = render(<Badge variant={variant}>Label</Badge>)
    const span = container.querySelector('span')!
    expect(span.className).toContain('badge')
    expect(span.className).toContain(expectedClass)
  })

  it('applies a custom className alongside the variant class', () => {
    const { container } = render(
      <Badge variant="success" className="ml-2">
        Active
      </Badge>
    )
    const span = container.querySelector('span')!
    expect(span.className).toContain('badge-success')
    expect(span.className).toContain('ml-2')
  })

  it('renders as a <span> element', () => {
    const { container } = render(<Badge>Test</Badge>)
    expect(container.querySelector('span')).not.toBeNull()
  })
})
