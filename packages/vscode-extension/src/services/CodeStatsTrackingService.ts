import type * as vscode from 'vscode'
import type { ApiClient } from '../api/ApiClient'
import { CodeStatsManager } from '../managers/CodeStatsManager'
import { GitReferenceManager } from '../managers/GitReferenceManager'
import { getWorkspacePath } from '../utils/workspace'

/**
 * Služba pro sledování a reportování statistik změn v kódu
 */
export class CodeStatsTrackingService implements vscode.Disposable {
  private readonly gitReferenceManager: GitReferenceManager
  private readonly codeStatsManager: CodeStatsManager
  private disposables: vscode.Disposable[] = []

  constructor(private readonly apiClient: ApiClient) {
    console.log('CodeStatsTrackingService: Inicializace služby')
    const workspacePath = getWorkspacePath()

    this.gitReferenceManager = new GitReferenceManager(workspacePath)
    this.codeStatsManager = new CodeStatsManager(apiClient, this.gitReferenceManager, workspacePath)
    this.disposables.push(this.codeStatsManager)

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
    await this.codeStatsManager.forceReportStats()
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
