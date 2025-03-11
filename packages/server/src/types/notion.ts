// Základní typy pro Notion
export type DateInput = Date | string | number
export interface NotionConfig {
  apiToken: string
  projectsDatabaseId: string
  tasksDatabaseId: string
  sessionsDatabaseId: string
}

interface PageTitle {
  title: [ { text: { content: string } } ]
}

export interface PageProperties {
  Name: PageTitle
  [key: string]: any
}

// Projekt
export interface ProjectInput {
  name: string
  slug?: string
  description?: string
  status?: 'Active' | 'Completed' | 'On Hold'
  repository?: string
  startDate?: DateInput
  taskIds?: string[]
}

export interface ProjectProperties extends PageProperties {
  'slug'?: { rich_text: [{ text: { content: string } }] }
  'Description'?: { rich_text: [{ text: { content: string } }] }
  'Status'?: { select: { name: 'Active' | 'Completed' | 'On Hold' } }
  'Repository'?: { url: string }
  'Start Date'?: { date: { start: string } } // ISO 8601 string
  'Tasks'?: { relation: { id: string }[] }
}

// Task
export interface TaskInput {
  name: string
  projectId?: string
  status?: 'Not Started' | 'In Progress' | 'Done'
  commitUrl?: string
  details?: string
  dueDate?: DateInput
  sessionIds?: string[]
}

export interface TaskProperties extends PageProperties {
  'Project'?: { relation: [{ id: string }] }
  'Status'?: { select: { name: 'Not Started' | 'In Progress' | 'Done' } }
  'Commit URL'?: { url: string }
  'Details'?: { rich_text: [{ text: { content: string } }] }
  'Due Date'?: { date: { start: string } }
  'Sessions'?: { relation: { id: string }[] }
}

// Session
export interface SessionInput {
  name: string
  taskId?: string
  date: { start: DateInput, end?: DateInput }
  ideTime?: number
  browserTime?: number
  filesChanged?: number
  linesAdded?: number
  linesRemoved?: number
}

export type MinimalRequiredSessionInput = Partial<SessionInput> & Required<Pick<SessionInput, 'date'>>

export interface SessionProperties extends PageProperties {
  'Task'?: { relation: [{ id: string }] }
  'Date': { date: { start?: string, end?: string } } // ISO 8601 string
  'IDE Time'?: { number: number }
  'Browser Time'?: { number: number }
  'Files Changed'?: { number: number }
  'Lines Added'?: { number: number }
  'Lines Removed'?: { number: number }
}
