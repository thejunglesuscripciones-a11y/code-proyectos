import type { Person, PersonContent } from '../types'

function generatePersonId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `person-${crypto.randomUUID()}`
  }
  return `person-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createPersonDraft(content: PersonContent): Person {
  return { id: generatePersonId(), ...content }
}

/** Up to 2 uppercase initials from a full name, used for the small avatar chips in the calendar. */
export function personInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}
