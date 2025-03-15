import type { ApiClient } from './ApiClient'
import type { GitStashManager } from './GitStashManager'
import * as vscode from 'vscode'

export class StatsReporter implements vscode.Disposable {
  private readonly interval: number = 60000 // Odesílat každou minutu
  private intervalId?: NodeJS.Timeout
  private fileWasSaved: boolean = false
  private disposables: vscode.Disposable[] = []

  constructor(
    private readonly gitStashManager: GitStashManager,
    private readonly apiClient: ApiClient,
  ) {
    // Registrace posluchače události uložení souboru
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(() => {
        this.fileWasSaved = true
        console.log('StatsReporter: Detekováno uložení souboru, statistiky budou odeslány při příštím intervalu')
      }),
    )
  }

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

    // Uvolnění posluchačů událostí
    for (const disposable of this.disposables)
      disposable.dispose()

    this.disposables = []
  }

  /**
   * Získá a odešle statistiky, pokud je uživatel aktivní
   */
  private async reportStats(): Promise<void> {
    try {
      // Kontrola, zda byl soubor uložen od posledního odeslání statistik
      if (!this.fileWasSaved) {
        console.log('StatsReporter: Od posledního odeslání nebyl uložen žádný soubor, přeskakuji odeslání statistik')
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

      // Resetování příznaku uložení souboru po úspěšném odeslání
      this.fileWasSaved = false
    }
    catch (error) {
      console.error('StatsReporter: Chyba při odesílání statistik:', error)
    }
  }
}
