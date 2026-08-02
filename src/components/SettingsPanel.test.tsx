import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SettingsPanel } from './SettingsPanel'
import { defaultCompanyData } from '../lib/storage'

describe('SettingsPanel', () => {
  it('saves and closes when all fields are valid', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onClose = vi.fn()
    render(<SettingsPanel company={defaultCompanyData} onSave={onSave} onClose={onClose} />)

    await user.type(screen.getByLabelText('RUC'), '20123456786')
    await user.type(screen.getByLabelText('Email corporativo'), 'contacto@thejunglefilms.com')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ ruc: '20123456786', email: 'contacto@thejunglefilms.com' }),
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('blocks saving and shows an error for an invalid RUC', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SettingsPanel company={defaultCompanyData} onSave={onSave} onClose={vi.fn()} />)

    await user.type(screen.getByLabelText('RUC'), '20123456789')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(screen.getByText('RUC inválido')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('blocks saving for an invalid email', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SettingsPanel company={defaultCompanyData} onSave={onSave} onClose={vi.fn()} />)

    await user.type(screen.getByLabelText('Email corporativo'), 'no-es-un-email')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(screen.getByText('Email inválido')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('blocks saving for an invalid phone', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SettingsPanel company={defaultCompanyData} onSave={onSave} onClose={vi.fn()} />)

    await user.type(screen.getByLabelText('Teléfono WhatsApp'), '12345')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(screen.getByText('Teléfono inválido')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('allows empty optional fields without validation errors', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SettingsPanel company={defaultCompanyData} onSave={onSave} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(onSave).toHaveBeenCalled()
  })
})
