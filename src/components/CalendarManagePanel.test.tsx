import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CalendarManagePanel } from './CalendarManagePanel'

describe('CalendarManagePanel', () => {
  it('calls the matching handler for each row', async () => {
    const user = userEvent.setup()
    const onOpenClients = vi.fn()
    const onOpenProjects = vi.fn()
    const onOpenTeam = vi.fn()
    render(<CalendarManagePanel onOpenClients={onOpenClients} onOpenProjects={onOpenProjects} onOpenTeam={onOpenTeam} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Clientes' }))
    expect(onOpenClients).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Proyectos' }))
    expect(onOpenProjects).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Equipo' }))
    expect(onOpenTeam).toHaveBeenCalled()
  })

  it('calls onClose when the close button is tapped', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<CalendarManagePanel onOpenClients={vi.fn()} onOpenProjects={vi.fn()} onOpenTeam={vi.fn()} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalled()
  })
})
