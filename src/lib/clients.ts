import type { Client, ClientContent } from '../types'

function generateClientId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `client-${crypto.randomUUID()}`
  }
  return `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createClientDraft(content: ClientContent): Client {
  return { id: generateClientId(), ...content }
}
