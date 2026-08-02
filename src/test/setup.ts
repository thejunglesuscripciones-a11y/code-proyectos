import '@testing-library/jest-dom/vitest'

// jsdom does not implement execCommand; the clipboard fallback path needs it to exist
// so tests can spy on/mock it, mirroring what real browsers provide.
if (!document.execCommand) {
  document.execCommand = () => false
}

// jsdom has no PointerEvent/pointer-capture support; polyfill the minimum the
// draggable floating button needs so drag/tap tests can dispatch real pointer events.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 0
    }
  }
  // @ts-expect-error minimal polyfill, not a full PointerEvent implementation
  window.PointerEvent = PointerEventPolyfill
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {}
}
