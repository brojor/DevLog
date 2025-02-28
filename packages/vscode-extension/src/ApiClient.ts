import type { Heartbeat } from '@toggl-auto-tracker/shared'
import * as vscode from 'vscode'

/**
 * Třída pro komunikaci se serverem
 */
export class ApiClient {
  private readonly serverUrl: string

  constructor() {
    // Získáme URL serveru z konfigurace
    const configServerUrl = vscode.workspace.getConfiguration('togglAutoTracker').get<string>('serverUrl')
    if (!configServerUrl || !this.isValidUrl(configServerUrl)) {
      throw new Error('Invalid or missing server URL in configuration')
    }
    this.serverUrl = configServerUrl
    console.log(`ApiClient: Inicializován s URL serveru ${this.serverUrl}`)
  }

  private isValidUrl(url: string): boolean {
    try {
      const _ = new URL(url)
      return true
    }
    catch {
      return false
    }
  }

  /**
   * Odesílá heartbeat na server
   */
  public async sendHeartbeat(data: Heartbeat): Promise<boolean> {
    try {
      console.log('ApiClient: Odesílání heartbeatu na server', data)

      const response = await fetch(`${this.serverUrl}/api/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Server odpověděl s chybou: ${response.status} ${response.statusText}`)
      }

      console.log('ApiClient: Heartbeat úspěšně odeslán')
      return true
    }
    catch (error) {
      console.error('ApiClient: Chyba při odesílání heartbeatu:', error)
      return false
    }
  }
}
