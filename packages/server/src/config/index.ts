import type { AppConfig } from '../types'
import { env } from 'node:process'
import dotenv from 'dotenv'
// Načtení proměnných prostředí
dotenv.config()

export const appConfig = {
  // Server nastavení
  server: {
    port: Number(env.PORT) || 3000,
    env: env.NODE_ENV || 'development',
  },

  // Notion API nastavení
  notion: {
    apiToken: env.NOTION_API_TOKEN || '',
    projectsDatabaseId: env.NOTION_PROJECTS_DATABASE_ID || '',
    tasksDatabaseId: env.NOTION_TASKS_DATABASE_ID || '',
    sessionsDatabaseId: env.NOTION_SESSIONS_DATABASE_ID || '',
  },

  // Nastavení aplikace
  session: {
    heartbeatInterval: 5,
    inactivityTimeout: 120,
    minSessionDuration: 60,
  },
} satisfies AppConfig
