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

  it('shows the default custom fields with their labels', () => {
    render(<SettingsPanel company={defaultCompanyData} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getAllByLabelText('Nombre')).toHaveLength(defaultCompanyData.customFields.length)
    expect(screen.getAllByLabelText('Nombre')[0]).toHaveValue('Instagram')
  })

  it('editing a custom field label and value is reflected on save', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SettingsPanel company={defaultCompanyData} onSave={onSave} onClose={vi.fn()} />)

    const values = screen.getAllByLabelText('Valor')
    await user.type(values[0], '@thejunglefilms')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        customFields: expect.arrayContaining([
          expect.objectContaining({ id: 'instagram', value: '@thejunglefilms' }),
        ]),
      }),
    )
  })

  it('deleting a custom field removes it before saving', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SettingsPanel company={defaultCompanyData} onSave={onSave} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Eliminar campo Instagram' }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    const saved = onSave.mock.calls[0][0]
    expect(saved.customFields.some((f: { id: string }) => f.id === 'instagram')).toBe(false)
    expect(saved.customFields).toHaveLength(defaultCompanyData.customFields.length - 1)
  })

  it('adding a new custom field appends it with a generated id', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SettingsPanel company={{ ...defaultCompanyData, customFields: [] }} onSave={onSave} onClose={vi.fn()} />)

    await user.type(screen.getByLabelText('Nuevo campo'), 'Horario de Atención')
    await user.click(screen.getByRole('button', { name: 'Agregar campo' }))

    expect(screen.getByLabelText('Nombre')).toHaveValue('Horario de Atención')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        customFields: [expect.objectContaining({ id: 'horario_de_atencion', label: 'Horario de Atención', value: '' })],
      }),
    )
  })

  it('adding a new custom field via Enter clears the input', async () => {
    const user = userEvent.setup()
    render(<SettingsPanel company={{ ...defaultCompanyData, customFields: [] }} onSave={vi.fn()} onClose={vi.fn()} />)

    const input = screen.getByLabelText('Nuevo campo')
    await user.type(input, 'Tarifas{Enter}')

    expect(input).toHaveValue('')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Tarifas')
  })

  it('does not add a field with a blank name', async () => {
    const user = userEvent.setup()
    render(<SettingsPanel company={{ ...defaultCompanyData, customFields: [] }} onSave={vi.fn()} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Agregar campo' }))
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument()
  })
})
