import type { ServiceCase } from './data'

const STORAGE_KEY = 'hl-service-prototype-demo-v2'

export interface DemoState {
  loggedIn: boolean
  selectedConversationId: string | null
  savedCaseId: string | null
  savedCases: ServiceCase[]
}

export const emptyDemoState: DemoState = {
  loggedIn: false,
  selectedConversationId: null,
  savedCaseId: null,
  savedCases: [],
}

export function loadDemoState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyDemoState
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return emptyDemoState
    const state = parsed as Partial<DemoState>
    const savedCases = Array.isArray(state.savedCases)
      ? state.savedCases.filter((item): item is ServiceCase =>
        item !== null && typeof item === 'object' && typeof item.id === 'string' && typeof item.contactId === 'string' && typeof item.createdAt === 'string')
      : []
    return {
      loggedIn: state.loggedIn === true,
      selectedConversationId: typeof state.selectedConversationId === 'string' ? state.selectedConversationId : null,
      savedCaseId: typeof state.savedCaseId === 'string' && savedCases.some((item) => item.id === state.savedCaseId) ? state.savedCaseId : null,
      savedCases,
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
  } catch {
    // In-memory reset remains available.
  }
}
