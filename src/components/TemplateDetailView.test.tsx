import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TemplateDetailView } from './TemplateDetailView'
import { builtInTemplates } from '../lib/templates'
import { defaultCompanyData } from '../lib/storage'

const company = { ...defaultCompanyData, banco: 'Banco Falso, Cuenta 000' }

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('TemplateDetailView', () => {
  it('shows the rendered preview text', () => {
    const template = builtInTemplates.find((t) => t.id === 'info-empresa')!
    render(<TemplateDetailView template={template} company={company} onBack={vi.fn()} onCopied={vi.fn()} />)
    expect(screen.getByText(/The Jungle Films/)).toBeInTheDocument()
  })

  it('copies to clipboard and shows the "¡Copiado!" indicator, then reverts', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    const template = builtInTemplates.find((t) => t.id === 'info-empresa')!
    const onCopied = vi.fn()
    render(<TemplateDetailView template={template} company={company} onBack={vi.fn()} onCopied={onCopied} />)

    await user.click(screen.getByRole('button', { name: /Copiar al portapapeles/ }))

    expect(writeText).toHaveBeenCalled()
    expect(await screen.findByText('¡Copiado!')).toBeInTheDocument()
    expect(onCopied).toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    await waitFor(() => expect(screen.queryByText('¡Copiado!')).not.toBeInTheDocument())
  })

  it('lets the user edit a variable before copying, and the edited value is what gets copied', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    const template = builtInTemplates.find((t) => t.id === 'cotizacion')!
    render(<TemplateDetailView template={template} company={company} onBack={vi.fn()} onCopied={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Editar valores' }))
    await user.type(screen.getByLabelText('tipo_trabajo'), 'Video corporativo')
    await user.click(screen.getByRole('button', { name: /Copiar al portapapeles/ }))

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Video corporativo'))
  })

  it('does not leak edited values into a fresh detail view for the same template', async () => {
    const user = userEvent.setup()
    const template = builtInTemplates.find((t) => t.id === 'brief-proyecto')!
    const { unmount } = render(
      <TemplateDetailView template={template} company={company} onBack={vi.fn()} onCopied={vi.fn()} />,
    )
    await user.click(screen.getByRole('button', { name: 'Editar valores' }))
    await user.type(screen.getByLabelText('cliente'), 'Cliente Confidencial')
    expect(screen.getByTestId('rendered-preview').textContent).toContain('Cliente Confidencial')
    unmount()

    render(<TemplateDetailView template={template} company={company} onBack={vi.fn()} onCopied={vi.fn()} />)
    expect(screen.getByTestId('rendered-preview').textContent).not.toContain('Cliente Confidencial')
  })

  it('calls onBack when the back button is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const template = builtInTemplates.find((t) => t.id === 'info-empresa')!
    render(<TemplateDetailView template={template} company={company} onBack={onBack} onCopied={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Volver' }))
    expect(onBack).toHaveBeenCalled()
  })
})
