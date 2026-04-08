import { render, screen } from '@testing-library/react'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  )
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

  it('affiche le texte BYS Formation', () => {
    render(<Footer />)
    expect(screen.getByText('BYS Formation')).toBeInTheDocument()
  })

  it('affiche le logo BYS', () => {
    render(<Footer />)
    expect(screen.getByText('BYS')).toBeInTheDocument()
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
    expect(screen.getByText(/partenaire de confiance/)).toBeInTheDocument()
  })

  it('affiche les liens des formations', () => {
    render(<Footer />)
    expect(screen.getByText('Récupération de points')).toBeInTheDocument()
    expect(screen.getByText('FIMO / FCO')).toBeInTheDocument()
  })

  it('affiche les liens sociaux avec aria-label', () => {
    render(<Footer />)
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument()
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
  })

  it('affiche le lien contact email', () => {
    render(<Footer />)
    expect(screen.getByText('bysforma95@gmail.com')).toBeInTheDocument()
  })
})
