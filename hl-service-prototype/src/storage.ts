import { serviceCases, type CaseActivity, type ServiceCase, type ServiceTask, type ServicesBooking, type StoredMessage } from './data'

const STORAGE_KEY = 'hl-service-prototype-demo-v3'
const PREVIOUS_STORAGE_KEY = 'hl-service-prototype-demo-v2'

export interface DemoState {
  loggedIn: boolean
  selectedConversationId: string | null
  savedCaseId: string | null
  savedCases: ServiceCase[]
  tasks: ServiceTask[]
  bookings: ServicesBooking[]
  activities: CaseActivity[]
  outboundMessages: StoredMessage[]
  updateCaseId: string | null
}

export const emptyDemoState: DemoState = {
  loggedIn: false,
  selectedConversationId: null,
  savedCaseId: null,
  savedCases: [],
  tasks: [],
  bookings: [],
  activities: [],
  outboundMessages: [],
  updateCaseId: null,
}

function validRecords<T>(value: unknown, fields: string[]): T[] {
  return Array.isArray(value) ? value.filter((item): item is T =>
    item !== null && typeof item === 'object' && fields.every((field) => typeof (item as Record<string, unknown>)[field] === 'string')) : []
}

export function loadDemoState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(PREVIOUS_STORAGE_KEY)
    if (!raw) return emptyDemoState
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return emptyDemoState
    const state = parsed as Partial<DemoState>
    const savedCases = validRecords<ServiceCase>(state.savedCases, ['id', 'contactId', 'createdAt'])
    return {
      loggedIn: state.loggedIn === true,
      selectedConversationId: typeof state.selectedConversationId === 'string' ? state.selectedConversationId : null,
      savedCaseId: typeof state.savedCaseId === 'string' && [...savedCases, ...serviceCases].some((item) => item.id === state.savedCaseId) ? state.savedCaseId : null,
      savedCases,
      tasks: validRecords<ServiceTask>(state.tasks, ['id', 'caseId', 'assigneeId', 'dueAt', 'status']),
      bookings: validRecords<ServicesBooking>(state.bookings, ['id', 'contactId', 'assetId', 'scheduledAt']),
      activities: validRecords<CaseActivity>(state.activities, ['id', 'caseId', 'createdAt', 'description']),
      outboundMessages: validRecords<StoredMessage>(state.outboundMessages, ['id', 'conversationId', 'text', 'createdAt']),
      updateCaseId: typeof state.updateCaseId === 'string' && savedCases.some((item) => item.id === state.updateCaseId) ? state.updateCaseId : null,
    }
  } catch {
    return emptyDemoState
  }
}

export function saveDemoState(state: DemoState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // The demo still works in memory if browser storage is unavailable.
  }
}

export function clearDemoState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(PREVIOUS_STORAGE_KEY)
  } catch {
    // In-memory reset remains available.
  }
}
