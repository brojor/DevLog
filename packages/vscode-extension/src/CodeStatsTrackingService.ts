import type * as vscode from 'vscode'
import type { ApiClient } from './ApiClient'
import { GitStashManager } from './GitStashManager'
import { StatsReporter } from './StatsReporter'

/**
 * Služba pro sledování a reportování statistik změn v kódu
 */
export class CodeStatsTrackingService implements vscode.Disposable {
  private readonly gitStashManager: GitStashManager
  private readonly statsReporter: StatsReporter
  private disposables: vscode.Disposable[] = []

  constructor(private readonly apiClient: ApiClient) {
    console.log('CodeStatsTrackingService: Inicializace služby')

    this.gitStashManager = new GitStashManager()
    this.statsReporter = new StatsReporter(this.gitStashManager, apiClient)
    this.disposables.push(this.statsReporter)

    this.disposables.push(
      this.apiClient.onSessionChange(async (newSessionId: string) => {
        await this.handleSessionChange(newSessionId)
      }),
    )
  }

  /**
   * Zpracuje změnu sessionId - vytvoří nový stash hash pro novou session
   */
  private async handleSessionChange(newSessionId: string): Promise<void> {
    console.log(`CodeStatsTrackingService: Změna sessionId na ${newSessionId}, vytvářím nový stash hash`)

    const stashHash = await this.gitStashManager.createStashHash()
    if (stashHash) {
      console.log(`CodeStatsTrackingService: Vytvořen nový stash hash ${stashHash} pro sessionId ${newSessionId}`)
    }
    else {
      console.warn(`CodeStatsTrackingService: Nepodařilo se vytvořit stash hash pro sessionId ${newSessionId}`)
    }
  }

  /**
   * Vynutí odeslání aktuálních statistik
   * @param reason Volitelný důvod pro vynucené odeslání (pro účely logování)
   */
  public async forceReportStats(reason?: string): Promise<void> {
    console.log(`CodeStatsTrackingService: Vynucené odeslání statistik${reason ? ` (důvod: ${reason})` : ''}`)
    await this.statsReporter.forceReportStats()
  }

  /**
   * Uvolní použité zdroje
   */
  public dispose(): void {
    console.log('CodeStatsTrackingService: Uvolňuji použité zdroje')
    for (const disposable of this.disposables) {
      disposable.dispose()
    }
    this.disposables = []
  }
}
