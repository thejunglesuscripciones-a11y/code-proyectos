import type { EventComment } from '../types'

function generateCommentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `comment-${crypto.randomUUID()}`
  }
  return `comment-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createCommentDraft(eventId: string, text: string, author: { name: string; email: string }): EventComment {
  return {
    id: generateCommentId(),
    eventId,
    authorName: author.name,
    authorEmail: author.email,
    text,
    createdAt: new Date().toISOString(),
  }
}
