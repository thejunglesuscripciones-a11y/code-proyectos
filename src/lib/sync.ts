import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { Attribution, CalendarEvent, Collaborator, TemplateContent, TemplateDefinition } from '../types'

const CUSTOM_TEMPLATES = 'templates'
const TEMPLATE_OVERRIDES = 'templateOverrides'
const COLLABORATORS = 'collaborators'
const CALENDAR_EVENTS = 'calendarEvents'

export type TemplateOverride = TemplateContent & { updatedBy?: Attribution }

export function stampAttribution(email: string, name: string): Attribution {
  return { email, name, updatedAt: new Date().toISOString() }
}

// ---- Custom templates ----

export function subscribeCustomTemplates(callback: (templates: TemplateDefinition[]) => void): () => void {
  return onSnapshot(collection(db, CUSTOM_TEMPLATES), (snapshot) => {
    callback(snapshot.docs.map((docSnap) => docSnap.data() as TemplateDefinition))
  })
}

export async function saveCustomTemplateRemote(template: TemplateDefinition, author: Attribution): Promise<void> {
  await setDoc(doc(db, CUSTOM_TEMPLATES, template.id), { ...template, updatedBy: author })
}

export async function deleteCustomTemplateRemote(templateId: string): Promise<void> {
  await deleteDoc(doc(db, CUSTOM_TEMPLATES, templateId))
}

export async function fetchCustomTemplatesOnce(): Promise<TemplateDefinition[]> {
  const snapshot = await getDocs(collection(db, CUSTOM_TEMPLATES))
  return snapshot.docs.map((docSnap) => docSnap.data() as TemplateDefinition)
}

// ---- Built-in template overrides ----

export function subscribeTemplateOverrides(callback: (overrides: Record<string, TemplateOverride>) => void): () => void {
  return onSnapshot(collection(db, TEMPLATE_OVERRIDES), (snapshot) => {
    const overrides: Record<string, TemplateOverride> = {}
    snapshot.docs.forEach((docSnap) => {
      overrides[docSnap.id] = docSnap.data() as TemplateOverride
    })
    callback(overrides)
  })
}

export async function saveTemplateOverrideRemote(
  templateId: string,
  content: TemplateContent,
  author: Attribution,
): Promise<void> {
  await setDoc(doc(db, TEMPLATE_OVERRIDES, templateId), { ...content, updatedBy: author })
}

export async function clearTemplateOverrideRemote(templateId: string): Promise<void> {
  await deleteDoc(doc(db, TEMPLATE_OVERRIDES, templateId))
}

export async function fetchTemplateOverridesOnce(): Promise<Record<string, TemplateOverride>> {
  const snapshot = await getDocs(collection(db, TEMPLATE_OVERRIDES))
  const overrides: Record<string, TemplateOverride> = {}
  snapshot.docs.forEach((docSnap) => {
    overrides[docSnap.id] = docSnap.data() as TemplateOverride
  })
  return overrides
}

// ---- Collaborators ----

export function subscribeCollaborators(callback: (collaborators: Collaborator[]) => void): () => void {
  return onSnapshot(collection(db, COLLABORATORS), (snapshot) => {
    callback(snapshot.docs.map((docSnap) => docSnap.data() as Collaborator))
  })
}

export async function saveCollaboratorRemote(collaborator: Collaborator, author: Attribution): Promise<void> {
  await setDoc(doc(db, COLLABORATORS, collaborator.id), { ...collaborator, updatedBy: author })
}

export async function deleteCollaboratorRemote(collaboratorId: string): Promise<void> {
  await deleteDoc(doc(db, COLLABORATORS, collaboratorId))
}

export async function fetchCollaboratorsOnce(): Promise<Collaborator[]> {
  const snapshot = await getDocs(collection(db, COLLABORATORS))
  return snapshot.docs.map((docSnap) => docSnap.data() as Collaborator)
}

// ---- Calendar events ----

export function subscribeCalendarEvents(callback: (events: CalendarEvent[]) => void): () => void {
  return onSnapshot(collection(db, CALENDAR_EVENTS), (snapshot) => {
    callback(snapshot.docs.map((docSnap) => docSnap.data() as CalendarEvent))
  })
}

export async function saveCalendarEventRemote(event: CalendarEvent, author: Attribution): Promise<void> {
  await setDoc(doc(db, CALENDAR_EVENTS, event.id), { ...event, updatedBy: author })
}

export async function deleteCalendarEventRemote(eventId: string): Promise<void> {
  await deleteDoc(doc(db, CALENDAR_EVENTS, eventId))
}

export async function fetchCalendarEventsOnce(): Promise<CalendarEvent[]> {
  const snapshot = await getDocs(collection(db, CALENDAR_EVENTS))
  return snapshot.docs.map((docSnap) => docSnap.data() as CalendarEvent)
}
