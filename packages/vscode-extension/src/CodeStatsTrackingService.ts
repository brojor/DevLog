import type * as vscode from 'vscode'
import type { ApiClient } from './ApiClient'
import { GitReferenceManager } from './GitReferenceManager'
import { StatsReporter } from './StatsReporter'
import { getWorkspacePath } from './utils/workspace'

/**
 * Služba pro sledování a reportování statistik změn v kódu
 */
export class CodeStatsTrackingService implements vscode.Disposable {
  private readonly gitReferenceManager: GitReferenceManager
  private readonly statsReporter: StatsReporter
  private disposables: vscode.Disposable[] = []

  constructor(private readonly apiClient: ApiClient) {
    console.log('CodeStatsTrackingService: Inicializace služby')
    const workspacePath = getWorkspacePath()

    this.gitReferenceManager = new GitReferenceManager(workspacePath)
    this.statsReporter = new StatsReporter(apiClient, this.gitReferenceManager, workspacePath)
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
    await this.gitReferenceManager.createReferencePoint()
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
