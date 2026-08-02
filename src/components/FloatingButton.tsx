import { useEffect, useRef, useState } from 'react'
import { Zap } from 'lucide-react'
import type { Position } from '../types'
import { clampPosition, isDrag } from '../lib/drag'
import { loadButtonPosition, saveButtonPosition } from '../lib/storage'

const BUTTON_SIZE = 64

interface FloatingButtonProps {
  onOpen: () => void
}

export function FloatingButton({ onOpen }: FloatingButtonProps) {
  const [position, setPosition] = useState<Position>(() => {
    const stored = loadButtonPosition()
    if (stored) return stored
    return {
      x: window.innerWidth - BUTTON_SIZE - 24,
      y: window.innerHeight - BUTTON_SIZE - 24,
    }
  })
  const dragState = useRef<{ start: Position; origin: Position; dragging: boolean } | null>(null)

  useEffect(() => {
    function handleResize() {
      setPosition((prev) =>
        clampPosition(prev, BUTTON_SIZE, window.innerWidth, window.innerHeight),
      )
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function handlePointerDown(event: React.PointerEvent) {
    dragState.current = {
      start: { x: event.clientX, y: event.clientY },
      origin: position,
      dragging: false,
    }
    ;(event.target as Element).setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent) {
    const state = dragState.current
    if (!state) return
    const current = { x: event.clientX, y: event.clientY }
    if (!state.dragging && isDrag(state.start, current)) {
      state.dragging = true
    }
    if (state.dragging) {
      const next = clampPosition(
        {
          x: state.origin.x + (current.x - state.start.x),
          y: state.origin.y + (current.y - state.start.y),
        },
        BUTTON_SIZE,
        window.innerWidth,
        window.innerHeight,
      )
      setPosition(next)
    }
  }

  function handlePointerUp() {
    const state = dragState.current
    if (state?.dragging) {
      saveButtonPosition(position)
    } else {
      onOpen()
    }
    dragState.current = null
  }

  return (
    <button
      type="button"
      aria-label="Abrir templates"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ left: position.x, top: position.y }}
      className="focus-ring fixed z-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-jungle to-jungle-dark text-white shadow-xl shadow-jungle/40 ring-4 ring-white/40 backdrop-blur-xl transition-transform duration-200 ease-out active:scale-90"
    >
      <span className="pointer-events-none absolute inset-x-1 top-1 h-6 rounded-full bg-gradient-to-b from-white/50 to-transparent blur-[1px]" />
      <Zap size={28} className="relative drop-shadow-sm" />
    </button>
  )
}
