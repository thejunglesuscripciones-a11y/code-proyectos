import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TeamPanel } from './TeamPanel'
import type { Person } from '../types'

const people: Person[] = [
  { id: 'person-1', name: 'Diego Zúñiga', roleLabel: 'Camarógrafo', isExternal: false, contactInfo: '' },
  { id: 'person-2', name: 'Kiara', roleLabel: '', isExternal: true, contactInfo: '' },
]

function renderPanel(overrides: Partial<React.ComponentProps<typeof TeamPanel>> = {}) {
  return render(<TeamPanel people={people} onSelect={vi.fn()} onCreate={vi.fn()} onBack={vi.fn()} {...overrides} />)
}

describe('TeamPanel', () => {
  it('lists every person with initials, role and external tag', () => {
    renderPanel()
    expect(screen.getByText('Diego Zúñiga')).toBeInTheDocument()
    expect(screen.getByText('Camarógrafo')).toBeInTheDocument()
    expect(screen.getByText('DZ')).toBeInTheDocument()
    expect(screen.getByText('Externo')).toBeInTheDocument()
  })

  it('calls onSelect with the tapped person', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderPanel({ onSelect })
    await user.click(screen.getByText('Diego Zúñiga'))
    expect(onSelect).toHaveBeenCalledWith(people[0])
  })

  it('calls onCreate when "Agregar al equipo" is tapped', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    renderPanel({ onCreate })
    await user.click(screen.getByRole('button', { name: /Agregar al equipo/ }))
    expect(onCreate).toHaveBeenCalled()
  })

  it('calls onBack when the back button is tapped', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    renderPanel({ onBack })
    await user.click(screen.getByRole('button', { name: 'Volver' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows an empty-state hint when there is no one in the team', () => {
    renderPanel({ people: [] })
    expect(screen.getByText(/Aún no agregas a nadie del equipo/)).toBeInTheDocument()
  })
})
