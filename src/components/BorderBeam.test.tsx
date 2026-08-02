import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BorderBeam } from './BorderBeam'

describe('BorderBeam', () => {
  it('renders a hidden decorative ring that does not intercept clicks', () => {
    const { container } = render(<BorderBeam />)
    const ring = container.firstElementChild as HTMLElement
    expect(ring).toHaveAttribute('aria-hidden')
    expect(ring.className).toContain('pointer-events-none')
    expect(ring.className).toContain('animate-border-beam')
  })

  it('applies the given radius class', () => {
    const { container } = render(<BorderBeam radiusClassName="rounded-panel" />)
    expect(container.firstElementChild).toHaveClass('rounded-panel')
  })
})
