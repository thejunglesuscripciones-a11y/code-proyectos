import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GlassPanel } from './GlassPanel'

describe('GlassPanel', () => {
  it('renders as a labeled dialog containing its children', () => {
    render(
      <GlassPanel ariaLabel="Panel de prueba">
        <p>Contenido</p>
      </GlassPanel>,
    )
    expect(screen.getByRole('dialog', { name: 'Panel de prueba' })).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })
})
