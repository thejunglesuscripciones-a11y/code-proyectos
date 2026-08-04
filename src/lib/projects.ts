import type { Project, ProjectContent, ProjectStatus } from '../types'

function generateProjectId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `project-${crypto.randomUUID()}`
  }
  return `project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createProjectDraft(content: ProjectContent): Project {
  return { id: generateProjectId(), ...content }
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  prospecto: 'Prospecto',
  en_curso: 'En curso',
  entregado: 'Entregado',
  cerrado: 'Cerrado',
}

export const PROJECT_STATUSES: ProjectStatus[] = ['prospecto', 'en_curso', 'entregado', 'cerrado']
