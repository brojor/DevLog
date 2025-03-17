import type { Heartbeat } from '@devlog/shared'
import type * as vscode from 'vscode'
import type { ApiClient } from '../api/ApiClient'
import { HeartbeatSource, TIME_CONSTANTS } from '@devlog/shared'

/**
 * Class responsible for regularly sending heartbeats to the server.
 */
export class HeartbeatManager implements vscode.Disposable {
  private heartbeatInterval: NodeJS.Timeout | undefined
  private isEnabled: boolean = false

  constructor(private apiClient: ApiClient) {}

  /**
   * Enables or disables sending heartbeats based on the window state.
   */
  public setEnabled(enabled: boolean): void {
    if (this.isEnabled === enabled) {
      return
    }

    this.isEnabled = enabled
    this.updateHeartbeatInterval()
  }

  /**
   * Updates the interval for sending heartbeats.
   */
  private updateHeartbeatInterval(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = undefined
    }

    if (this.isEnabled) {
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat()
      }, TIME_CONSTANTS.IDE_HEARTBEAT_INTERVAL_MS)
    }
  }

  /**
   * Sends a heartbeat to the server.
   */
  private sendHeartbeat(): void {
    const heartbeat: Heartbeat = {
      timestamp: Date.now(),
      source: HeartbeatSource.VSCODE,
    }

    this.apiClient.sendHeartbeat(heartbeat)
  }

  dispose(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = undefined
    }
  }
}
