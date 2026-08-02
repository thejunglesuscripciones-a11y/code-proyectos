import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FloatingButton } from './FloatingButton'

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('innerWidth', 400)
  vi.stubGlobal('innerHeight', 800)
})

function fire(button: Element, type: string, x: number, y: number) {
  fireEvent(
    button,
    new PointerEvent(type, { clientX: x, clientY: y, bubbles: true, pointerId: 1 }),
  )
}

describe('FloatingButton', () => {
  it('opens the modal on a plain tap (no movement)', () => {
    const onOpen = vi.fn()
    render(<FloatingButton onOpen={onOpen} />)
    const button = screen.getByRole('button', { name: 'Abrir templates' })

    fire(button, 'pointerdown', 300, 700)
    fire(button, 'pointerup', 300, 700)

    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('does not open the modal when the pointer moves past the drag threshold', () => {
    const onOpen = vi.fn()
    render(<FloatingButton onOpen={onOpen} />)
    const button = screen.getByRole('button', { name: 'Abrir templates' })

    fire(button, 'pointerdown', 300, 700)
    fire(button, 'pointermove', 350, 700)
    fire(button, 'pointerup', 350, 700)

    expect(onOpen).not.toHaveBeenCalled()
  })

  it('persists the new position to localStorage after a drag', () => {
    const onOpen = vi.fn()
    render(<FloatingButton onOpen={onOpen} />)
    const button = screen.getByRole('button', { name: 'Abrir templates' })

    fire(button, 'pointerdown', 300, 700)
    fire(button, 'pointermove', 250, 650)
    fire(button, 'pointerup', 250, 650)

    const stored = JSON.parse(localStorage.getItem('jungleFilms_buttonPosition')!)
    expect(stored).toBeTruthy()
  })

  it('restores the last saved position on mount', () => {
    localStorage.setItem('jungleFilms_buttonPosition', JSON.stringify({ x: 42, y: 99 }))
    render(<FloatingButton onOpen={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Abrir templates' })
    expect(button).toHaveStyle({ left: '42px', top: '99px' })
  })

  it('re-clamps position on window resize so it stays on-screen', () => {
    localStorage.setItem('jungleFilms_buttonPosition', JSON.stringify({ x: 380, y: 780 }))
    render(<FloatingButton onOpen={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Abrir templates' })
    expect(button).toHaveStyle({ left: '380px', top: '780px' })

    vi.stubGlobal('innerWidth', 200)
    vi.stubGlobal('innerHeight', 300)
    fireEvent(window, new Event('resize'))

    expect(button).toHaveStyle({ left: '136px', top: '236px' })
  })

  it('clamps a dragged-past-the-edge position back on screen', () => {
    render(<FloatingButton onOpen={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Abrir templates' })

    fire(button, 'pointerdown', 300, 700)
    fire(button, 'pointermove', 5000, 5000)
    fire(button, 'pointerup', 5000, 5000)

    const stored = JSON.parse(localStorage.getItem('jungleFilms_buttonPosition')!)
    expect(stored.x).toBeLessThanOrEqual(400)
    expect(stored.y).toBeLessThanOrEqual(800)
  })
})
