import { render, screen } from '@testing-library/react'

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  )
  MockLink.displayName = 'MockNextLink'
  return MockLink
})

// Mock FontAwesome
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, ...props }: { icon: { iconName: string }; [key: string]: unknown }) => (
    <span data-testid={`fa-icon-${icon?.iconName || 'unknown'}`} {...props} />
  ),
}))

import Footer from '@/components/layout/Footer'

describe('Footer', () => {
  it('se rend sans erreur', () => {
    render(<Footer />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('affiche le logo BYS Formation', () => {
    render(<Footer />)
    // Logo SVG avec alt accessibilité
    expect(screen.getAllByAltText('BYS Formation').length).toBeGreaterThan(0)
  })

  it('affiche le lien CGU', () => {
    render(<Footer />)
    const cguLink = screen.getByRole('link', { name: 'CGU' })
    expect(cguLink).toBeInTheDocument()
    expect(cguLink).toHaveAttribute('href', '/cgu')
  })

  it('affiche le lien Mentions legales', () => {
    render(<Footer />)
    const links = screen.getAllByRole('link', { name: 'Mentions légales' })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toHaveAttribute('href', '/mentions-legales')
  })

  it('affiche le lien Politique de confidentialite', () => {
    render(<Footer />)
    const link = screen.getByRole('link', { name: 'Politique de confidentialité' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/politique-de-confidentialite')
  })

  it('affiche l\'annee 2026', () => {
    render(<Footer />)
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it('affiche la description de l\'entreprise', () => {
    render(<Footer />)
    expect(screen.getByText(/marketplace de référence/)).toBeInTheDocument()
  })

  it('affiche les liens des stages par ville', () => {
    render(<Footer />)
    expect(screen.getByText('Trouver un stage')).toBeInTheDocument()
    expect(screen.getByText('Stage à Paris')).toBeInTheDocument()
  })

  it('affiche les liens sociaux avec aria-label', () => {
    render(<Footer />)
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument()
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
  })

  it('affiche le lien contact email', () => {
    render(<Footer />)
    expect(screen.getByText('contact@byspermis.fr')).toBeInTheDocument()
  })
})
