import { describe, expect, it } from 'vitest'
import { clampPosition, DRAG_THRESHOLD_PX, isDrag } from './drag'

describe('clampPosition', () => {
  const buttonSize = 64
  const viewport = { w: 400, h: 800 }

  it('leaves an in-bounds position untouched', () => {
    expect(clampPosition({ x: 100, y: 200 }, buttonSize, viewport.w, viewport.h)).toEqual({
      x: 100,
      y: 200,
    })
  })

  it('clamps a negative x (dragged past the left edge)', () => {
    expect(clampPosition({ x: -50, y: 200 }, buttonSize, viewport.w, viewport.h).x).toBe(0)
  })

  it('clamps a negative y (dragged past the top edge)', () => {
    expect(clampPosition({ x: 100, y: -50 }, buttonSize, viewport.w, viewport.h).y).toBe(0)
  })

  it('clamps x past the right edge so the button stays fully visible', () => {
    const result = clampPosition({ x: 5000, y: 200 }, buttonSize, viewport.w, viewport.h)
    expect(result.x).toBe(viewport.w - buttonSize)
  })

  it('clamps y past the bottom edge so the button stays fully visible', () => {
    const result = clampPosition({ x: 100, y: 5000 }, buttonSize, viewport.w, viewport.h)
    expect(result.y).toBe(viewport.h - buttonSize)
  })

  it('clamps into all four corners simultaneously', () => {
    expect(clampPosition({ x: -100, y: -100 }, buttonSize, viewport.w, viewport.h)).toEqual({
      x: 0,
      y: 0,
    })
    expect(clampPosition({ x: 9999, y: 9999 }, buttonSize, viewport.w, viewport.h)).toEqual({
      x: viewport.w - buttonSize,
      y: viewport.h - buttonSize,
    })
  })

  it('does not produce a negative max when the viewport is smaller than the button', () => {
    const result = clampPosition({ x: 500, y: 500 }, buttonSize, 40, 40)
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
  })
})

describe('isDrag', () => {
  it('treats a tiny movement (a tap) as not a drag', () => {
    expect(isDrag({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(false)
  })

  it('treats movement past the threshold as a drag', () => {
    expect(isDrag({ x: 0, y: 0 }, { x: DRAG_THRESHOLD_PX + 5, y: 0 })).toBe(true)
  })

  it('is exclusive at exactly the threshold distance', () => {
    expect(isDrag({ x: 0, y: 0 }, { x: DRAG_THRESHOLD_PX, y: 0 })).toBe(false)
  })

  it('accounts for diagonal movement using euclidean distance', () => {
    expect(isDrag({ x: 0, y: 0 }, { x: 5, y: 5 })).toBe(true)
  })
})
