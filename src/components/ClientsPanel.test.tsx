import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ClientsPanel } from './ClientsPanel'
import type { Client } from '../types'

const clients: Client[] = [
  { id: 'client-1', name: 'Adidas Perú', contactName: 'Renzo', contactEmail: '', contactPhone: '+51 987 654 321', notes: '' },
  { id: 'client-2', name: 'Skechers', contactName: '', contactEmail: '', contactPhone: '', notes: '' },
]

function renderPanel(overrides: Partial<React.ComponentProps<typeof ClientsPanel>> = {}) {
  return render(<ClientsPanel clients={clients} onSelect={vi.fn()} onCreate={vi.fn()} onBack={vi.fn()} {...overrides} />)
}

describe('ClientsPanel', () => {
  it('lists every client, showing contact details when present', () => {
    renderPanel()
    expect(screen.getByText('Adidas Perú')).toBeInTheDocument()
    expect(screen.getByText('Renzo · +51 987 654 321')).toBeInTheDocument()
    expect(screen.getByText('Skechers')).toBeInTheDocument()
  })

  it('calls onSelect with the tapped client', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderPanel({ onSelect })
    await user.click(screen.getByText('Adidas Perú'))
    expect(onSelect).toHaveBeenCalledWith(clients[0])
  })

  it('calls onCreate when "Nuevo cliente" is tapped', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    renderPanel({ onCreate })
    await user.click(screen.getByRole('button', { name: /Nuevo cliente/ }))
    expect(onCreate).toHaveBeenCalled()
  })

  it('calls onBack when the back button is tapped', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    renderPanel({ onBack })
    await user.click(screen.getByRole('button', { name: 'Volver' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows an empty-state hint when there are no clients', () => {
    renderPanel({ clients: [] })
    expect(screen.getByText(/Aún no agregas clientes/)).toBeInTheDocument()
  })
})
