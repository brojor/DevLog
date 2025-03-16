import type { WindowState } from '@devlog/shared'
import * as vscode from 'vscode'

/**
 * Class responsible for monitoring the state of the VS Code window
 */
export class WindowStateManager implements vscode.Disposable {
  private windowState: WindowState
  private disposables: vscode.Disposable[] = []
  private readonly onStateChangeEmitter = new vscode.EventEmitter<WindowState>()

  constructor() {
    this.windowState = {
      active: vscode.window.state.active,
      focused: vscode.window.state.focused,
    }

    this.disposables.push(
      vscode.window.onDidChangeWindowState(e => this.handleWindowStateChange(e)),
      this.onStateChangeEmitter,
    )
  }

  /**
   * Event that fires when window state changes
   */
  public readonly onStateChange = this.onStateChangeEmitter.event

  /**
   * Getter for the current window state
   */
  public get state(): WindowState {
    return { ...this.windowState }
  }

  /**
   * Handles the change in window state
   */
  private handleWindowStateChange({ active, focused }: vscode.WindowState): void {
    this.windowState = { active, focused }
    this.onStateChangeEmitter.fire(this.windowState)
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose()
    }
    this.disposables = []
  }
}
