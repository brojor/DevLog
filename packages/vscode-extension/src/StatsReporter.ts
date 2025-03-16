import type { CodeStatsReport } from '@devlog/shared'
import type { ApiClient } from './ApiClient'
import type { GitStashManager } from './GitStashManager'
import { TIME_CONSTANTS } from '@devlog/shared'
import * as vscode from 'vscode'

export class StatsReporter implements vscode.Disposable {
  private lastReportTimestamp: number = 0
  private readonly disposables: vscode.Disposable[] = []
  private readonly debouncedReport: (() => void) & { cancel: () => void }

  constructor(
    private readonly gitStashManager: GitStashManager,
    private readonly apiClient: ApiClient,
  ) {
    this.debouncedReport = this.createDebouncedReport(TIME_CONSTANTS.CODE_STATS_REPORT_DEBOUNCE_MS)
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(() => this.debouncedReport()),
      vscode.workspace.onDidDeleteFiles(() => this.debouncedReport()),
    )
  }

  private createDebouncedReport(delay: number): (() => void) & { cancel: () => void } {
    let timeoutId: NodeJS.Timeout | undefined

    const debouncedFn = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      const reportStats = () => {
        void this.reportStats()
      }
      timeoutId = setTimeout(reportStats, delay)
    }

    debouncedFn.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = undefined
      }
    }

    return debouncedFn
  }

  private async reportStats(): Promise<void> {
    try {
      const stats = await this.gitStashManager.getDiffStats()
      if (!stats) {
        console.log('StatsReporter: Nepodařilo se získat statistiky')
        return
      }

      const report: CodeStatsReport = {
        ...stats,
        timestamp: Date.now(),
      }

      await this.apiClient.sendStats(report)
      this.lastReportTimestamp = report.timestamp

      console.log(`StatsReporter: Statistiky úspěšně odeslány (${report.filesChanged} souborů, +${report.linesAdded}/-${report.linesRemoved} řádků)`)
    }
    catch (error) {
      console.error('StatsReporter: Chyba při zpracování statistik:', error)
    }
  }

  public async forceReportStats(): Promise<void> {
    await this.reportStats()
  }

  public dispose(): void {
    this.debouncedReport.cancel()
    for (const disposable of this.disposables) {
      disposable.dispose()
    }
  }
}
