import type { WindowState } from '@devlog/shared'
import type { ApiClient } from './ApiClient'
import * as vscode from 'vscode'

/**
 * Class responsible for monitoring the state of the VS Code window
 */
export class WindowStateManager implements vscode.Disposable {
  private windowState: WindowState
  private disposables: vscode.Disposable[] = []
  private stateChangeCallback: ((state: WindowState) => void) | undefined

  constructor(private apiClient: ApiClient) {
    this.windowState = {
      active: vscode.window.state.active,
      focused: vscode.window.state.focused,
    }

    this.disposables.push(
      vscode.window.onDidChangeWindowState(e => this.handleWindowStateChange(e)),
    )

    this.sendWindowState()
  }

  /**
   * Sets a callback that will be called on every window state change
   */
  public onStateChange(callback: (state: WindowState) => void): void {
    this.stateChangeCallback = callback
  }

  /**
   * Getter for the current window state
   */
  public get state(): WindowState {
    return { ...this.windowState }
  }

  /**
   * Handles the change in window state
   */
  private handleWindowStateChange(e: vscode.WindowState): void {
    this.windowState = { active: e.active, focused: e.focused }

    this.sendWindowState()

    if (this.stateChangeCallback) {
      this.stateChangeCallback(this.windowState)
    }
  }

  /**
   * Sends the current window state to the server
   */
  private sendWindowState(): void {
    this.apiClient.sendWindowState({ windowState: this.windowState, timestamp: Date.now() })
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose()
    }
    this.disposables = []
  }
}
