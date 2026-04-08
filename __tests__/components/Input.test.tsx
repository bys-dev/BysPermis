import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('affiche le label quand il est fourni', () => {
    render(<Input label="Email" />)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('lie le label au champ input via htmlFor', () => {
    render(<Input label="Email" />)
    const label = screen.getByText('Email')
    const input = screen.getByRole('textbox')
    expect(label).toHaveAttribute('for', input.id)
  })

  it('se rend sans label', () => {
    render(<Input placeholder="Tapez ici" />)
    expect(screen.getByPlaceholderText('Tapez ici')).toBeInTheDocument()
  })

  it('gere le onChange', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<Input label="Nom" onChange={onChange} />)

    await user.type(screen.getByRole('textbox'), 'Hello')
    expect(onChange).toHaveBeenCalled()
  })

  it('affiche le message d\'erreur', () => {
    render(<Input label="Email" error="Email invalide" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Email invalide')
  })

  it('applique les styles d\'erreur sur le champ', () => {
    render(<Input label="Email" error="Champ requis" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('associe l\'erreur au champ via aria-describedby', () => {
    render(<Input label="Email" error="Champ requis" />)
    const input = screen.getByRole('textbox')
    const errorId = input.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(document.getElementById(errorId!)).toHaveTextContent('Champ requis')
  })

  it('n\'affiche pas d\'erreur quand error est absent', () => {
    render(<Input label="Email" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
