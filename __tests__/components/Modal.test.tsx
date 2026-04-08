import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '@/components/ui/Modal'

describe('Modal', () => {
  it('affiche le contenu quand isOpen=true', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Confirmer">
        <p>Contenu de la modale</p>
      </Modal>
    )
    expect(screen.getByText('Confirmer')).toBeInTheDocument()
    expect(screen.getByText('Contenu de la modale')).toBeInTheDocument()
  })

  it('ne rend rien quand isOpen=false', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()} title="Confirmer">
        <p>Contenu cache</p>
      </Modal>
    )
    expect(screen.queryByText('Confirmer')).not.toBeInTheDocument()
    expect(screen.queryByText('Contenu cache')).not.toBeInTheDocument()
  })

  it('affiche le titre', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Mon titre">
        <p>Body</p>
      </Modal>
    )
    expect(screen.getByText('Mon titre')).toBeInTheDocument()
  })

  it('affiche les enfants', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test">
        <span>Enfant 1</span>
        <span>Enfant 2</span>
      </Modal>
    )
    expect(screen.getByText('Enfant 1')).toBeInTheDocument()
    expect(screen.getByText('Enfant 2')).toBeInTheDocument()
  })

  it('appelle onClose quand le bouton fermer est clique', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Fermer test">
        <p>Contenu</p>
      </Modal>
    )

    const closeButton = screen.getByLabelText('Fermer la modale')
    await user.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('a le role dialog et aria-modal', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Accessible">
        <p>Contenu</p>
      </Modal>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })
})
