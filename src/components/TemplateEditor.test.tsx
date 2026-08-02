import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TemplateEditor } from './TemplateEditor'
import type { TemplateDefinition } from '../types'

const customTemplate: TemplateDefinition = {
  id: 'custom-1',
  name: 'Mi Template',
  emoji: '📌',
  category: 'General',
  body: 'Hola {cliente}',
  isCustom: true,
}

const builtInTemplate: TemplateDefinition = {
  id: 'info-empresa',
  name: 'Información de Empresa',
  emoji: '📋',
  category: 'Comercial',
  body: 'RUC: {empresa_ruc}',
  isCustom: false,
}

function setup(overrides: Partial<React.ComponentProps<typeof TemplateEditor>> = {}) {
  const props = {
    template: null,
    canReset: false,
    onSave: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onReset: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
  render(<TemplateEditor {...props} />)
  return props
}

describe('TemplateEditor — create mode', () => {
  it('shows "Nuevo template" as the title and no duplicate/delete/reset actions', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Nuevo template' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Duplicar template' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar template' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restaurar original' })).not.toBeInTheDocument()
  })

  it('blocks saving with an empty name and body', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El mensaje no puede estar vacío')).toBeInTheDocument()
    expect(props.onSave).not.toHaveBeenCalled()
  })

  it('saves trimmed content and defaults an empty category/emoji', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.type(screen.getByLabelText(/Nombre/), '  Aviso  ')
    await user.type(screen.getByLabelText(/Mensaje/), 'Hola {{cliente}')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(props.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Aviso', body: 'Hola {cliente}', category: 'General' }),
    )
  })

  it('detects variables live as the body is typed, excluding {empresa_*} tokens', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText(/Mensaje/), 'Hola {{cliente}, RUC {{empresa_ruc}')
    expect(screen.getByText('{cliente}')).toBeInTheDocument()
    expect(screen.queryByText('{empresa_ruc}', { selector: 'span' })).not.toBeInTheDocument()
  })

  it('inserts a company token into the body when its chip is clicked', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: '{empresa_email}' }))
    expect(screen.getByLabelText(/Mensaje/)).toHaveValue('{empresa_email}')
  })
})

describe('TemplateEditor — editing a custom template', () => {
  it('pre-fills the form and shows duplicate/delete but not reset', () => {
    setup({ template: customTemplate })
    expect(screen.getByRole('dialog', { name: `Editar ${customTemplate.name}` })).toBeInTheDocument()
    expect(screen.getByLabelText(/Nombre/)).toHaveValue(customTemplate.name)
    expect(screen.getByLabelText(/Mensaje/)).toHaveValue(customTemplate.body)
    expect(screen.getByRole('button', { name: 'Duplicar template' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar template' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restaurar original' })).not.toBeInTheDocument()
  })

  it('calls onDuplicate and onDelete', async () => {
    const user = userEvent.setup()
    const props = setup({ template: customTemplate })
    await user.click(screen.getByRole('button', { name: 'Duplicar template' }))
    expect(props.onDuplicate).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Eliminar template' }))
    expect(props.onDelete).toHaveBeenCalled()
  })
})

describe('TemplateEditor — editing a built-in template', () => {
  it('never shows delete, and only shows reset when canReset is true', () => {
    const { rerender } = render(
      <TemplateEditor
        template={builtInTemplate}
        canReset={false}
        onSave={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onReset={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Eliminar template' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restaurar original' })).not.toBeInTheDocument()

    rerender(
      <TemplateEditor
        template={builtInTemplate}
        canReset
        onSave={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onReset={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Restaurar original' })).toBeInTheDocument()
  })

  it('calls onReset', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    setup({ template: builtInTemplate, canReset: true, onReset })
    await user.click(screen.getByRole('button', { name: 'Restaurar original' }))
    expect(onReset).toHaveBeenCalled()
  })
})

describe('TemplateEditor — close', () => {
  it('calls onClose', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(props.onClose).toHaveBeenCalled()
  })
})
