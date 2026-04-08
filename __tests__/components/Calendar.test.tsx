import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Calendar } from '@/components/ui/Calendar'

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

describe('Calendar', () => {
  it('affiche le mois et l\'annee courants', () => {
    const today = new Date()
    render(<Calendar events={[]} />)
    const expectedText = `${MONTHS[today.getMonth()]} ${today.getFullYear()}`
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it('affiche les jours de la semaine', () => {
    render(<Calendar events={[]} />)
    expect(screen.getByText('Lun')).toBeInTheDocument()
    expect(screen.getByText('Mar')).toBeInTheDocument()
    expect(screen.getByText('Mer')).toBeInTheDocument()
    expect(screen.getByText('Jeu')).toBeInTheDocument()
    expect(screen.getByText('Ven')).toBeInTheDocument()
    expect(screen.getByText('Sam')).toBeInTheDocument()
    expect(screen.getByText('Dim')).toBeInTheDocument()
  })

  it('affiche les numeros de jours du mois', () => {
    render(<Calendar events={[]} />)
    // Le jour 15 existe dans tous les mois
    expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(1)
  })

  it('met en valeur le jour actuel avec bg-blue-600', () => {
    const today = new Date()
    render(<Calendar events={[]} />)
    const dayNumber = today.getDate().toString()
    // Cherche le span contenant le numero du jour actuel avec la classe de surbrillance
    const dayElements = screen.getAllByText(dayNumber)
    const highlightedDay = dayElements.find((el) =>
      el.className.includes('bg-blue-600')
    )
    expect(highlightedDay).toBeDefined()
  })

  it('change de mois avec le bouton suivant', async () => {
    const user = userEvent.setup()
    const today = new Date()
    const nextMonth = (today.getMonth() + 1) % 12
    const nextYear = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear()
    const expectedText = `${MONTHS[nextMonth]} ${nextYear}`

    render(<Calendar events={[]} />)

    // Le bouton suivant contient la fleche droite (→)
    const buttons = screen.getAllByRole('button')
    const nextButton = buttons.find((btn) => btn.textContent?.includes('\u2192'))
    expect(nextButton).toBeDefined()

    await user.click(nextButton!)
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it('change de mois avec le bouton precedent', async () => {
    const user = userEvent.setup()
    const today = new Date()
    const prevMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1
    const prevYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear()
    const expectedText = `${MONTHS[prevMonth]} ${prevYear}`

    render(<Calendar events={[]} />)

    // Le bouton precedent contient la fleche gauche (←)
    const buttons = screen.getAllByRole('button')
    const prevButton = buttons.find((btn) => btn.textContent?.includes('\u2190'))
    expect(prevButton).toBeDefined()

    await user.click(prevButton!)
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it('affiche les evenements dans le calendrier', () => {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-15`
    const events = [
      { id: '1', title: 'Stage permis', date: dateStr, color: '#22c55e' },
    ]
    render(<Calendar events={events} />)
    const matches = screen.getAllByText('Stage permis')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })
})
