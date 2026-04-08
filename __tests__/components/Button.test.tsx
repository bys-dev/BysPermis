import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('affiche le texte enfant', () => {
    render(<Button>Valider</Button>)
    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument()
  })

  it('applique la classe variant primary par defaut', () => {
    const { container } = render(<Button>OK</Button>)
    const btn = container.querySelector('button')!
    expect(btn.className).toContain('btn-primary')
  })

  it.each([
    ['primary', 'btn-primary'],
    ['secondary', 'btn-secondary'],
    ['ghost', 'btn-ghost'],
  ] as const)('applique la classe correcte pour le variant "%s"', (variant, expectedClass) => {
    const { container } = render(<Button variant={variant}>Label</Button>)
    const btn = container.querySelector('button')!
    expect(btn.className).toContain(expectedClass)
  })

  it('gere le clic', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Cliquer</Button>)

    await user.click(screen.getByRole('button', { name: 'Cliquer' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('affiche un spinner quand loading=true', () => {
    render(<Button loading>Chargement</Button>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('est desactive quand loading=true', () => {
    render(<Button loading>Chargement</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('est desactive quand disabled=true', () => {
    render(<Button disabled>Non cliquable</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applique les classes de taille', () => {
    const { container } = render(<Button size="lg">Grand</Button>)
    const btn = container.querySelector('button')!
    expect(btn.className).toContain('px-8')
    expect(btn.className).toContain('py-4')
  })

  it('transmet les className additionnels', () => {
    const { container } = render(<Button className="mt-4">Styled</Button>)
    const btn = container.querySelector('button')!
    expect(btn.className).toContain('mt-4')
  })
})
