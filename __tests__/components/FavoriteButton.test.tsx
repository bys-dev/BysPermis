import { render, screen } from '@testing-library/react'
import FavoriteButton from '@/components/ui/FavoriteButton'

// Mock FontAwesome pour eviter les problemes de rendu SVG
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, ...props }: { icon: { iconName: string }; [key: string]: unknown }) => (
    <span data-testid="fa-icon" data-icon={icon.iconName} {...props} />
  ),
}))

// Mock fetch pour les appels API
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: false } as Response)
  )
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('FavoriteButton', () => {
  it('se rend sans erreur', () => {
    render(<FavoriteButton formationId="123" />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('affiche une icone coeur', () => {
    render(<FavoriteButton formationId="123" />)
    expect(screen.getByTestId('fa-icon')).toBeInTheDocument()
  })

  it('affiche le coeur vide par defaut (non authentifie)', () => {
    render(<FavoriteButton formationId="123" />)
    const icon = screen.getByTestId('fa-icon')
    // Par defaut, l'utilisateur n'est pas authentifie, donc le coeur est vide (regular = heart)
    expect(icon.getAttribute('data-icon')).toBe('heart')
  })

  it('a le titre "Ajouter aux favoris" par defaut', () => {
    render(<FavoriteButton formationId="123" />)
    expect(screen.getByTitle('Ajouter aux favoris')).toBeInTheDocument()
  })

  it('a le bon aria-label par defaut', () => {
    render(<FavoriteButton formationId="123" />)
    expect(screen.getByLabelText('Ajouter aux favoris')).toBeInTheDocument()
  })

  it('applique les classes de taille sm', () => {
    const { container } = render(<FavoriteButton formationId="123" size="sm" />)
    const btn = container.querySelector('button')!
    expect(btn.className).toContain('w-7')
    expect(btn.className).toContain('h-7')
  })

  it('applique les classes de taille lg', () => {
    const { container } = render(<FavoriteButton formationId="123" size="lg" />)
    const btn = container.querySelector('button')!
    expect(btn.className).toContain('w-11')
    expect(btn.className).toContain('h-11')
  })

  it('transmet le className additionnel', () => {
    const { container } = render(<FavoriteButton formationId="123" className="absolute top-2 right-2" />)
    const btn = container.querySelector('button')!
    expect(btn.className).toContain('absolute')
    expect(btn.className).toContain('top-2')
  })
})
