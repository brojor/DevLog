import { env } from 'node:process'

export const config = {
  // Server nastavení
  server: {
    port: env.PORT || 3000,
    env: env.NODE_ENV || 'development',
  },

  // Toggl API nastavení
  toggl: {
    apiUrl: 'https://api.track.toggl.com/api/v9',
    apiToken: env.TOGGL_API_TOKEN || '',
    workspaceId: env.TOGGL_WORKSPACE_ID || '',
  },

  // Nastavení aplikace
  app: {
    heartbeatInterval: 30, // v sekundách
    inactivityTimeout: 120, // v sekundách, ukončí time entry po 2 minutách neaktivity
  },
}
