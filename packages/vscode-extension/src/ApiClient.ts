import type { CodeStats, CommitInfo, Heartbeat, HeartbeatResponse, WindowStateEvent } from '@devlog/shared'
import * as vscode from 'vscode'

/**
 * Client for communication with the DevLog server
 */
export class ApiClient {
  private readonly serverUrl: string
  public sessionId: string | null = null

  // Event emitter for notifying sessionId changes
  private readonly _onSessionChange = new vscode.EventEmitter<string>()
  public readonly onSessionChange = this._onSessionChange.event

  constructor() {
    // Get server URL from configuration
    const configServerUrl = vscode.workspace.getConfiguration('devlog').get<string>('serverUrl')
    if (!configServerUrl || !this.isValidUrl(configServerUrl)) {
      throw new Error('Invalid or missing server URL in configuration')
    }
    this.serverUrl = configServerUrl
    console.log(`ApiClient: Initialized with server URL ${this.serverUrl}`)
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
   * Sends heartbeat data to the server
   */
  public async sendHeartbeat(data: Heartbeat): Promise<string | null> {
    try {
      console.log('ApiClient: Sending heartbeat to server', data)

      const response = await fetch(`${this.serverUrl}/api/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Server responded with error: ${response.status} ${response.statusText}`)
      }

      // return await this.processResponse(response, 'Heartbeat')
      const { sessionId } = await response.json() as HeartbeatResponse

      // If sessionId has changed, update it and emit an event
      if (sessionId !== this.sessionId) {
        this.sessionId = sessionId
        this._onSessionChange.fire(sessionId)
      }

      console.log(`ApiClient: Heartbeat successfully sent, sessionId: ${sessionId}`)
      return sessionId
    }
    catch (error) {
      console.error('ApiClient: Error sending heartbeat:', error)
      return null
    }
  }

  /**
   * Sends code statistics to the server
   */
  public async sendStats(stats: CodeStats): Promise<void> {
    try {
      console.log('ApiClient: Sending statistics to server', stats)

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

      console.log('ApiClient: Statistics successfully sent')
    }
    catch (error) {
      console.error('ApiClient: Error sending statistics:', error)
    }
  }

  /**
   * Sends commit information to the server in the new format
   */
  public async sendCommitInfo(commitInfo: CommitInfo): Promise<void> {
    try {
      console.log('ApiClient: Sending commit info to server', commitInfo)

      const response = await fetch(`${this.serverUrl}/api/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commitInfo),
      })

      if (!response.ok) {
        throw new Error(`Server odpověděl s chybou: ${response.status} ${response.statusText}`)
      }

      console.log('ApiClient: Commit info successfully sent')
    }
    catch (error) {
      console.error('ApiClient: Error sending commit info:', error)
    }
  }

  /**
   * Sends window state changes to the server
   */
  async sendWindowState(windowStateEvent: WindowStateEvent): Promise<void> {
    try {
      const response = await fetch(`${this.serverUrl}/api/ide/window-state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(windowStateEvent),
      })

      if (!response.ok) {
        throw new Error(`Chyba při odesílání stavu okna: ${response.status} ${response.statusText}`)
      }

      console.log('ApiClient: Window state successfully sent')
    }
    catch (error) {
      console.error('Chyba při komunikaci se serverem:', error)
      throw error
    }
  }
}
