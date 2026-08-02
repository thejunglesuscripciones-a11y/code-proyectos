import type { Position } from '../types'

/** Clamps a position so the button (buttonSize) stays fully within the viewport (viewportW/H). */
export function clampPosition(
  pos: Position,
  buttonSize: number,
  viewportW: number,
  viewportH: number,
): Position {
  return {
    x: Math.min(Math.max(pos.x, 0), Math.max(0, viewportW - buttonSize)),
    y: Math.min(Math.max(pos.y, 0), Math.max(0, viewportH - buttonSize)),
  }
}

/** A pointer movement counts as a drag (not a tap) once it exceeds this many pixels. */
export const DRAG_THRESHOLD_PX = 6

export function isDrag(start: Position, end: Position): boolean {
  const dx = end.x - start.x
  const dy = end.y - start.y
  return Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD_PX
}
