// Typy specifické pro server
export interface TimeEntry {
  id?: number
  description: string
  workspace_id: string | number
  project_id?: number
  start: string
  stop?: string
  duration?: number
  created_with: string
  tags?: string[]
}

// Typy pro interní používání na serveru
export interface ActiveTimeEntry {
  id?: number
  startTime: Date
  lastHeartbeat: Date
  source: 'vscode' | 'chrome'
  projectName?: string
  description?: string
}
