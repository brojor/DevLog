import type { ActivityTracker } from './ActivityTracker'
import * as vscode from 'vscode'

/**
 * Třída pro zobrazení stavu sledování ve status baru
 */
export class StatusBarController {
  private statusBarItem: vscode.StatusBarItem
  private activityTracker: ActivityTracker

  constructor(activityTracker: ActivityTracker) {
    this.activityTracker = activityTracker

    // Vytvoříme statusbar položku v pravé části status baru
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100, // priorita - vyšší číslo znamená umístění více vlevo
    )

    // Nastavíme příkaz, který se spustí při kliknutí na položku
    this.statusBarItem.command = 'toggl-auto-tracker.togglePause'

    // Aktualizujeme a zobrazíme statusbar položku
    this.updateStatusBar()
    this.statusBarItem.show()
  }

  /**
   * Aktualizuje text a ikonu statusbar položky podle stavu sledování
   */
  public updateStatusBar(): void {
    const isPaused = this.activityTracker.paused

    if (isPaused) {
      this.statusBarItem.text = '$(debug-pause) Toggl: Pozastaveno'
      this.statusBarItem.tooltip = 'Toggl Auto Tracker je pozastaven. Kliknutím obnovíte sledování.'
    }
    else {
      this.statusBarItem.text = '$(record) Toggl: Aktivní'
      this.statusBarItem.tooltip = 'Toggl Auto Tracker aktivně sleduje vaši činnost. Kliknutím pozastavíte sledování.'
    }
  }

  /**
   * Uvolní zdroje
   */
  public dispose(): void {
    this.statusBarItem.dispose()
  }
}
