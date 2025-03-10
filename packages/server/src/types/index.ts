import type { CodeStats } from '@devlog/shared'

export interface ActiveSession {
  id: string | null
  lastActivity: number
  ideTime: number
  browserTime: number
  codeStats: CodeStats
}

export interface ServerConfig {
  port: number
  env: string
}

export interface SessionConfig {
  inactivityTimeout: number
  heartbeatInterval: number
  minSessionDuration: number
}

export interface NotionConfig {
  apiToken: string
  projectsDatabaseId: string
  tasksDatabaseId: string
  sessionsDatabaseId: string
}

export interface AppConfig {
  server: ServerConfig
  session: SessionConfig
  notion: NotionConfig
}
