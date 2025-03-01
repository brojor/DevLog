// Typy specifické pro server
export interface TimeEntryResponse {
  id: number
  workspace_id: number
  project_id: number | null
  task_id: number | null
  billable: boolean
  start: string
  stop: string | null
  duration: number
  description: string | null
  tags: string[] | null
  tag_ids: number[] | null
  duronly: boolean
  at: string
  server_deleted_at: string | null
  user_id: number
  uid: number
  wid: number
}

export interface TimeEntryRequest {
  billable?: boolean // Výchozí hodnota false
  created_with: string // Povinné
  description?: string
  duration?: number // Záporné číslo pro běžící položky, preferovaně -1
  duronly?: boolean // Zastaralé, lze ignorovat
  event_metadata?: Record<string, any> // Objekt bez definované struktury
  pid?: number // Starší pole pro Project ID
  project_id?: number
  shared_with_user_ids?: number[] // Seznam ID uživatelů
  start: string // Povinné, formát: 2006-01-02T15:04:05Z
  start_date?: string // Formát: 2006-11-07
  stop?: string // Může být vynecháno u běžících položek
  tag_action?: 'add' | 'delete' // Používá se při aktualizaci
  tag_ids?: number[]
  tags?: string[] // Pokud tag neexistuje, automaticky se vytvoří
  task_id?: number
  tid?: number // Starší pole pro Task ID
  uid?: number // Starší pole pro User ID
  user_id?: number // Pokud není uvedeno, použije se ID uživatele požadavku
  wid?: number // Starší pole pro Workspace ID
  workspace_id: number // Povinné
}

export interface CommitInfo {
  message: string
  timestamp: number
}

export interface ActiveSession {
  sessionId: number // ID time entry v Toggl
  projectName?: string // Název projektu v Toggl
  lastActivity: number // Unix timestamp poslední aktivity
  vsCodeTime: number // Čas v sekundách strávený v VS Code
  browserTime: number // Čas v sekundách strávený v prohlížeči
  filesChanged?: number // Statistiky kódu
  linesAdded?: number
  linesRemoved?: number
}

export interface CreateNewSessionParams {
  start?: number
  description?: string
  projectName?: string
}
