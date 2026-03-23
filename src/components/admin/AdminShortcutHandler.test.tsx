import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminShortcutHandler } from '@/components/admin/AdminShortcutHandler'

function renderWithRouter(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AdminShortcutHandler />
      <Routes>
        <Route path="/" element={<div>Portal</div>} />
        <Route path="/admin/login" element={<div>Tela de login</div>} />
        <Route path="/admin/dados" element={<div>Área admin</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminShortcutHandler', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('abre a tela de login ao pressionar Ctrl+Enter sem sessão ativa', async () => {
    const user = userEvent.setup()

    renderWithRouter()

    await user.keyboard('{Control>}{Enter}{/Control}')

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })

  it('vai direto para o admin quando a sessão já está autenticada', async () => {
    const user = userEvent.setup()
    window.sessionStorage.setItem('portal-admin-authenticated', 'true')

    renderWithRouter()

    await user.keyboard('{Control>}{Enter}{/Control}')

    expect(screen.getByText('Área admin')).toBeInTheDocument()
  })
})
