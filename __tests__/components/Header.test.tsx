import { render, screen } from '@testing-library/react'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  )
})

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock useNotifications
jest.mock('@/lib/useNotifications', () => ({
  useNotifications: () => ({
    unreadCount: 0,
    notifications: [],
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock FontAwesome
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, ...props }: { icon: { iconName: string }; [key: string]: unknown }) => (
    <span data-testid={`fa-icon-${icon?.iconName || 'unknown'}`} {...props} />
  ),
}))

// Mock fetch (for auth check + localStorage)
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: false } as Response)
  )
  // Mock localStorage
  const store: Record<string, string> = {}
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] ?? null)
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { store[key] = value })
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => { delete store[key] })
})

afterEach(() => {
  jest.restoreAllMocks()
})

import Header from '@/components/layout/Header'

describe('Header', () => {
  it('se rend sans erreur', () => {
    render(<Header />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('affiche le logo BYS', () => {
    render(<Header />)
    expect(screen.getByText('BYS')).toBeInTheDocument()
  })

  it('affiche le texte BYS Formation', () => {
    render(<Header />)
    expect(screen.getByText('BYS Formation')).toBeInTheDocument()
  })

  it('affiche les liens de navigation', () => {
    render(<Header />)
    expect(screen.getByText('Stages')).toBeInTheDocument()
    expect(screen.getByText('Nos Centres')).toBeInTheDocument()
    expect(screen.getByText('Blog')).toBeInTheDocument()
    expect(screen.getByText('FAQ')).toBeInTheDocument()
  })

  it('a un lien vers Espace Pro', () => {
    render(<Header />)
    expect(screen.getByText('Espace Pro')).toBeInTheDocument()
  })

  it('affiche le lien Connexion quand non authentifie', () => {
    render(<Header />)
    // Il y a deux liens Connexion (desktop + mobile)
    const connexionLinks = screen.getAllByText('Connexion')
    expect(connexionLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('a un lien "Reserver un stage"', () => {
    render(<Header />)
    const reserveLinks = screen.getAllByText('Réserver un stage')
    expect(reserveLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('affiche le bandeau ministeriel', () => {
    render(<Header />)
    expect(screen.getByText(/Agréé Ministère de l'Intérieur/)).toBeInTheDocument()
  })
})
