import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SettingsPanel } from './SettingsPanel'
import { defaultCompanyData } from '../lib/storage'
import type { Attribution } from '../types'

vi.mock('../lib/sync', () => ({
  fetchCustomTemplatesOnce: vi.fn().mockResolvedValue([]),
  fetchTemplateOverridesOnce: vi.fn().mockResolvedValue({}),
  fetchCollaboratorsOnce: vi.fn().mockResolvedValue([]),
  saveCustomTemplateRemote: vi.fn().mockResolvedValue(undefined),
  saveTemplateOverrideRemote: vi.fn().mockResolvedValue(undefined),
  saveCollaboratorRemote: vi.fn().mockResolvedValue(undefined),
}))

const author: Attribution = { name: 'Joaquín', email: 'joaquin.huamani.v@gmail.com', updatedAt: '2026-01-01T00:00:00.000Z' }

describe('SettingsPanel', () => {
  it('saves and closes when all fields are valid', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onClose = vi.fn()
    render(<SettingsPanel company={defaultCompanyData} author={author} onSave={onSave} onClose={onClose} onImported={vi.fn()} />)

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
    render(<SettingsPanel company={defaultCompanyData} author={author} onSave={onSave} onClose={vi.fn()} onImported={vi.fn()} />)

    await user.type(screen.getByLabelText('RUC'), '20123456789')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(screen.getByText('RUC inválido')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('blocks saving for an invalid email', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SettingsPanel company={defaultCompanyData} author={author} onSave={onSave} onClose={vi.fn()} onImported={vi.fn()} />)

    await user.type(screen.getByLabelText('Email corporativo'), 'no-es-un-email')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(screen.getByText('Email inválido')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('blocks saving for an invalid phone', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SettingsPanel company={defaultCompanyData} author={author} onSave={onSave} onClose={vi.fn()} onImported={vi.fn()} />)

    await user.type(screen.getByLabelText('Teléfono WhatsApp'), '12345')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(screen.getByText('Teléfono inválido')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('allows empty optional fields without validation errors', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SettingsPanel company={defaultCompanyData} author={author} onSave={onSave} onClose={vi.fn()} onImported={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(onSave).toHaveBeenCalled()
  })

  it('shows the default custom fields with their labels', () => {
    render(<SettingsPanel company={defaultCompanyData} author={author} onSave={vi.fn()} onClose={vi.fn()} onImported={vi.fn()} />)
    expect(screen.getAllByLabelText('Nombre')).toHaveLength(defaultCompanyData.customFields.length)
    expect(screen.getAllByLabelText('Nombre')[0]).toHaveValue('Instagram')
  })

  it('editing a custom field label and value is reflected on save', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SettingsPanel company={defaultCompanyData} author={author} onSave={onSave} onClose={vi.fn()} onImported={vi.fn()} />)

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
    render(<SettingsPanel company={defaultCompanyData} author={author} onSave={onSave} onClose={vi.fn()} onImported={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Eliminar campo Instagram' }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    const saved = onSave.mock.calls[0][0]
    expect(saved.customFields.some((f: { id: string }) => f.id === 'instagram')).toBe(false)
    expect(saved.customFields).toHaveLength(defaultCompanyData.customFields.length - 1)
  })

  it('adding a new custom field appends it with a generated id', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <SettingsPanel
        company={{ ...defaultCompanyData, customFields: [] }}
        author={author}
        onSave={onSave}
        onClose={vi.fn()}
        onImported={vi.fn()}
      />,
    )

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
    render(
      <SettingsPanel
        company={{ ...defaultCompanyData, customFields: [] }}
        author={author}
        onSave={vi.fn()}
        onClose={vi.fn()}
        onImported={vi.fn()}
      />,
    )

    const input = screen.getByLabelText('Nuevo campo')
    await user.type(input, 'Tarifas{Enter}')

    expect(input).toHaveValue('')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Tarifas')
  })

  it('does not add a field with a blank name', async () => {
    const user = userEvent.setup()
    render(
      <SettingsPanel
        company={{ ...defaultCompanyData, customFields: [] }}
        author={author}
        onSave={vi.fn()}
        onClose={vi.fn()}
        onImported={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Agregar campo' }))
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument()
  })

  describe('backup', () => {
    it('exports a backup file when the export button is clicked', async () => {
      const user = userEvent.setup()
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      render(<SettingsPanel company={defaultCompanyData} author={author} onSave={vi.fn()} onClose={vi.fn()} onImported={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: 'Exportar respaldo' }))

      expect(await screen.findByRole('button', { name: 'Exportar respaldo' })).toBeInTheDocument()
      expect(clickSpy).toHaveBeenCalled()
      clickSpy.mockRestore()
    })

    it('imports a valid backup file, updates the form, and notifies the parent', async () => {
      const onImported = vi.fn()
      render(<SettingsPanel company={defaultCompanyData} author={author} onSave={vi.fn()} onClose={vi.fn()} onImported={onImported} />)

      const backup = {
        version: 1,
        company: { ...defaultCompanyData, ruc: '20123456786' },
        favorites: [],
        customTemplates: [],
        templateOverrides: {},
      }
      const file = new File([JSON.stringify(backup)], 'respaldo.json', { type: 'application/json' })
      fireEvent.change(screen.getByLabelText('Importar respaldo'), { target: { files: [file] } })

      expect(await screen.findByText('Respaldo importado correctamente.')).toBeInTheDocument()
      expect(onImported).toHaveBeenCalled()
      expect(screen.getByLabelText('RUC')).toHaveValue('20123456786')
    })

    it('shows an error and does not notify the parent for an invalid file', async () => {
      const onImported = vi.fn()
      render(<SettingsPanel company={defaultCompanyData} author={author} onSave={vi.fn()} onClose={vi.fn()} onImported={onImported} />)

      const file = new File(['not valid json'], 'respaldo.json', { type: 'application/json' })
      fireEvent.change(screen.getByLabelText('Importar respaldo'), { target: { files: [file] } })

      expect(await screen.findByText('El archivo no es un respaldo válido.')).toBeInTheDocument()
      expect(onImported).not.toHaveBeenCalled()
    })
  })
})
