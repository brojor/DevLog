import type * as vscode from 'vscode'
import type { ActivityTracker } from './ActivityTracker'
import type { ApiClient } from './ApiClient'
import type { GitStashManager } from './GitStashManager'

export class StatsReporter implements vscode.Disposable {
  private readonly interval: number = 60000 // Odesílat každou minutu
  private intervalId?: NodeJS.Timeout

  constructor(
    private readonly activityTracker: ActivityTracker,
    private readonly gitStashManager: GitStashManager,
    private readonly apiClient: ApiClient,
  ) {}

  /**
   * Spustí pravidelné odesílání statistik
   */
  public start(): void {
    console.log('StatsReporter: Spouštím pravidelné odesílání statistik')
    this.intervalId = setInterval(() => void this.reportStats(), this.interval)
  }

  /**
   * Zastaví pravidelné odesílání statistik
   */
  public dispose(): void {
    console.log('StatsReporter: Zastavuji pravidelné odesílání statistik')
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  /**
   * Okamžitě odešle statistiky bez ohledu na interval
   * Používá se například při commitu
   */
  public async forceReportStats(): Promise<void> {
    console.log('StatsReporter: Vynucené odeslání statistik')
    await this.reportStats()
  }

  /**
   * Získá a odešle statistiky, pokud je uživatel aktivní
   */
  private async reportStats(): Promise<void> {
    try {
      if (this.activityTracker.paused) {
        console.log('StatsReporter: Sledování aktivity je pozastaveno, přeskakuji odeslání statistik')
        return
      }

      // Kontrola aktivity uživatele
      if (Date.now() - this.activityTracker.lastActivityTime > this.interval) {
        console.log('StatsReporter: Uživatel není aktivní, přeskakuji odeslání statistik')
        return
      }

      // Získání statistik
      const stats = await this.gitStashManager.getDiffStats()
      if (!stats) {
        console.log('StatsReporter: Nepodařilo se získat statistiky')
        return
      }

      // Odeslání statistik
      await this.apiClient.sendStats(stats)
    }
    catch (error) {
      console.error('StatsReporter: Chyba při odesílání statistik:', error)
    }
  }
}
