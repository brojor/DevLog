import type { CodeStats, CommitInfo, Heartbeat } from '@devlog/shared'
import * as vscode from 'vscode'

/**
 * Client for communication with the DevLog server
 */
export class ApiClient {
  private readonly serverUrl: string
  public sessionId: number | null = null

  // Event emitter for notifying sessionId changes
  private readonly _onSessionChange = new vscode.EventEmitter<number>()
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
  public async sendHeartbeat(data: Heartbeat): Promise<number | null> {
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

      return await this.processResponse(response, 'Heartbeat')
    }
    catch (error) {
      console.error('ApiClient: Error sending heartbeat:', error)
      return null
    }
  }

  /**
   * Sends code statistics to the server
   */
  public async sendStats(stats: CodeStats): Promise<number | null> {
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

      return await this.processResponse(response, 'Statistiky')
    }
    catch (error) {
      console.error('ApiClient: Error sending statistics:', error)
      return null
    }
  }

  /**
   * Sends commit information to the server in the new format
   */
  public async sendCommitInfo(commitInfo: CommitInfo): Promise<number | null> {
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

      return await this.processResponse(response, 'Commit info')
    }
    catch (error) {
      console.error('ApiClient: Error sending commit info:', error)
      return null
    }
  }

  /**
   * Processes server response and extracts sessionId
   * @private
   */
  private async processResponse(response: Response, actionName: string): Promise<number> {
    const responseData = await response.json() as { sessionId: number }
    const newSessionId = responseData.sessionId

    // If sessionId has changed, update it and emit an event
    if (newSessionId !== this.sessionId) {
      this.sessionId = newSessionId
      this._onSessionChange.fire(newSessionId)
    }

    console.log(`ApiClient: ${actionName} successfully sent, sessionId:`, newSessionId)
    return newSessionId
  }
}
