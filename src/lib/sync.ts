import { collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, where } from 'firebase/firestore'
import { db } from './firebase'
import type {
  Attribution,
  CalendarEvent,
  Client,
  Collaborator,
  EventComment,
  Person,
  Project,
  TemplateContent,
  TemplateDefinition,
} from '../types'

const CUSTOM_TEMPLATES = 'templates'
const TEMPLATE_OVERRIDES = 'templateOverrides'
const COLLABORATORS = 'collaborators'
const CLIENTS = 'clients'
const PROJECTS = 'projects'
const PEOPLE = 'people'
const EVENTS = 'events'
const COMMENTS = 'comments'

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

// ---- Clients ----

export function subscribeClients(callback: (clients: Client[]) => void): () => void {
  return onSnapshot(collection(db, CLIENTS), (snapshot) => {
    callback(snapshot.docs.map((docSnap) => docSnap.data() as Client))
  })
}

export async function saveClientRemote(client: Client, author: Attribution): Promise<void> {
  await setDoc(doc(db, CLIENTS, client.id), { ...client, updatedBy: author })
}

export async function deleteClientRemote(clientId: string): Promise<void> {
  await deleteDoc(doc(db, CLIENTS, clientId))
}

// ---- Projects ----

export function subscribeProjects(callback: (projects: Project[]) => void): () => void {
  return onSnapshot(collection(db, PROJECTS), (snapshot) => {
    callback(snapshot.docs.map((docSnap) => docSnap.data() as Project))
  })
}

export async function saveProjectRemote(project: Project, author: Attribution): Promise<void> {
  await setDoc(doc(db, PROJECTS, project.id), { ...project, updatedBy: author })
}

export async function deleteProjectRemote(projectId: string): Promise<void> {
  await deleteDoc(doc(db, PROJECTS, projectId))
}

// ---- People ("Equipo" in the UI — see ADR-006) ----

export function subscribePeople(callback: (people: Person[]) => void): () => void {
  return onSnapshot(collection(db, PEOPLE), (snapshot) => {
    callback(snapshot.docs.map((docSnap) => docSnap.data() as Person))
  })
}

export async function savePersonRemote(person: Person, author: Attribution): Promise<void> {
  await setDoc(doc(db, PEOPLE, person.id), { ...person, updatedBy: author })
}

export async function deletePersonRemote(personId: string): Promise<void> {
  await deleteDoc(doc(db, PEOPLE, personId))
}

// ---- Calendar events ----

export function subscribeCalendarEvents(callback: (events: CalendarEvent[]) => void): () => void {
  return onSnapshot(collection(db, EVENTS), (snapshot) => {
    callback(snapshot.docs.map((docSnap) => docSnap.data() as CalendarEvent))
  })
}

/** Events are never hard-deleted — cancelling flips `status` to 'cancelado' and stays visible (undoable). */
export async function saveCalendarEventRemote(event: CalendarEvent, author: Attribution): Promise<void> {
  await setDoc(doc(db, EVENTS, event.id), { ...event, updatedBy: author })
}

// ---- Comments (simple, event-scoped — see docs/25-mvp.md) ----

export function subscribeEventComments(eventId: string, callback: (comments: EventComment[]) => void): () => void {
  const q = query(collection(db, COMMENTS), where('eventId', '==', eventId))
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((docSnap) => docSnap.data() as EventComment)
    comments.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    callback(comments)
  })
}

export async function saveCommentRemote(comment: EventComment): Promise<void> {
  await setDoc(doc(db, COMMENTS, comment.id), comment)
}
