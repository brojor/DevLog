// Definice typu pro komunikaci s API
export interface HeartbeatPayload {
  source: 'vscode' | 'chrome'
  projectInfo?: string
  timestamp: number
}

export interface CommitPayload {
  commitMessage: string
  repository: string
  timestamp: number
}

// Konstanty pro celý projekt
export const API_ENDPOINTS = {
  HEARTBEAT: '/heartbeat',
  COMMIT: '/commit',
}

// Pomocné funkce pro práci s časem
export function getCurrentTimestamp(): number {
  return Date.now()
}

// Jednoduché rozhraní pro Toggl API
export interface TogglTimeEntry {
  description: string
  pid?: number // Project ID
  start: string
  stop?: string
  duration?: number
  tags?: string[]
}
