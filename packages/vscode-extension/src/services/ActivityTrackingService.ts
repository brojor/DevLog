import type { WindowState } from '@devlog/shared'
import type * as vscode from 'vscode'
import type { ApiClient } from '../api/ApiClient'
import { HeartbeatManager } from '../managers/HeartbeatManager'
import { WindowStateManager } from '../managers/WindowStateManager'

/**
 * Service responsible for tracking VS Code window activity and coordinating heartbeats
 */
export class ActivityTrackingService implements vscode.Disposable {
  private readonly windowStateManager: WindowStateManager
  private readonly heartbeatManager: HeartbeatManager
  private disposables: vscode.Disposable[] = []

  constructor(private readonly apiClient: ApiClient) {
    this.windowStateManager = new WindowStateManager()
    this.heartbeatManager = new HeartbeatManager(apiClient)

    this.disposables.push(
      this.windowStateManager,
      this.heartbeatManager,
      this.windowStateManager.onStateChange(state => this.handleWindowStateChange(state)),
    )

    const initialState = this.windowStateManager.state
    this.handleWindowStateChange(initialState)
  }

  /**
   * Handles window state changes and coordinates related actions
   */
  private handleWindowStateChange(state: WindowState): void {
    this.heartbeatManager.setEnabled(state.active && state.focused)
    this.sendWindowState(state)
  }

  /**
   * Sends the window state to the server
   */
  private sendWindowState(state: WindowState): void {
    this.apiClient.sendWindowState({ windowState: state, timestamp: Date.now() })
  }

  /**
   * Disposes of the activity tracking service
   */
  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose()
    }
    this.disposables = []
  }
}
