import type { CodeStats, Heartbeat } from '@devlog/shared'
import * as vscode from 'vscode'

/**
 * Třída pro komunikaci se serverem
 */
export class ApiClient {
  private readonly serverUrl: string
  public sessionId: number | null = null

  // Event emitter pro oznamování změn sessionId
  private readonly _onSessionChange = new vscode.EventEmitter<number>()
  public readonly onSessionChange = this._onSessionChange.event

  constructor() {
    // Získáme URL serveru z konfigurace
    const configServerUrl = vscode.workspace.getConfiguration('devlog').get<string>('serverUrl')
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
  public async sendHeartbeat(data: Heartbeat): Promise<number | null> {
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

      return await this.processResponse(response, 'Heartbeat')
    }
    catch (error) {
      console.error('ApiClient: Chyba při odesílání heartbeatu:', error)
      return null
    }
  }

  /**
   * Odesílá statistiky o změnách v kódu na server
   */
  public async sendStats(stats: CodeStats): Promise<number | null> {
    try {
      console.log('ApiClient: Odesílání statistik na server', stats)

      const response = await fetch(`${this.serverUrl}/api/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stats),
      })

      if (!response.ok) {
        throw new Error(`Server odpověděl s chybou: ${response.status} ${response.statusText}`)
      }

      return await this.processResponse(response, 'Statistiky')
    }
    catch (error) {
      console.error('ApiClient: Chyba při odesílání statistik:', error)
      return null
    }
  }

  /**
   * Odesílá informace o commitu včetně statistik kódu na server
   */
  public async sendCommitInfo(
    message: string,
    timestamp: number,
    stats: CodeStats,
  ): Promise<number | null> {
    try {
      const commitData = {
        message,
        timestamp,
        stats,
      }

      console.log('ApiClient: Odesílání commit info na server', commitData)

      const response = await fetch(`${this.serverUrl}/api/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commitData),
      })

      if (!response.ok) {
        throw new Error(`Server odpověděl s chybou: ${response.status} ${response.statusText}`)
      }

      return await this.processResponse(response, 'Commit info')
    }
    catch (error) {
      console.error('ApiClient: Chyba při odesílání commit info:', error)
      return null
    }
  }

  /**
   * Zpracuje odpověď ze serveru a extrahuje sessionId
   * @private
   */
  private async processResponse(response: Response, actionName: string): Promise<number> {
    const responseData = await response.json() as { sessionId: number }
    const newSessionId = responseData.sessionId

    // Pokud se sessionId změnilo, aktualizujeme ho a emitujeme událost
    if (newSessionId !== this.sessionId) {
      this.sessionId = newSessionId
      this._onSessionChange.fire(newSessionId)
    }

    console.log(`ApiClient: ${actionName} úspěšně odesláno, sessionId:`, newSessionId)
    return newSessionId
  }
}
