import type { ApiClient } from './ApiClient'
import type { GitStashManager } from './GitStashManager'
// GitSupportManager.ts
import * as vscode from 'vscode'
import { CommitWatcher } from './CommitWatcher'
import { GitHookManager } from './GitHookManager'

export class GitSupportManager implements vscode.Disposable {
  private gitHookManager: GitHookManager | undefined
  private commitWatcher: CommitWatcher | undefined

  constructor(
    private readonly apiClient: ApiClient,
    private readonly gitStashManager: GitStashManager,
  ) {}

  /**
   * Inicializuje podporu pro Git commity
   */
  public async initialize(): Promise<void> {
    // Získáme kořenové složky workspace
    const workspaceFolders = vscode.workspace.workspaceFolders

    if (!workspaceFolders || workspaceFolders.length === 0) {
      console.log('GitSupportManager: Žádné workspace složky k dispozici')
      return
    }

    const rootPath = workspaceFolders[0].uri.fsPath

    // Inicializace GitHookManager pro instalaci hooků
    this.gitHookManager = new GitHookManager(rootPath)
    await this.gitHookManager.installPostCommitHook()

    // Vytvoření a inicializace CommitWatcher
    const handleCommit = async (message: string, timestamp: number) => {
      // Získáme aktuální statistiky kódu
      const stats = await this.gitStashManager.getDiffStats()
      if (!stats) {
        console.log('GitSupportManager: Žádné statistiky kódu k dispozici')
        return
      }
      // Odešleme commit a statistiky na server
      await this.apiClient.sendCommitInfo(message, timestamp, stats)
    }

    // Inicializace a spuštění CommitWatcher
    this.commitWatcher = new CommitWatcher(rootPath, handleCommit)
    await this.commitWatcher.initialize()
  }

  public dispose(): void {
    if (this.commitWatcher) {
      this.commitWatcher.dispose()
      this.commitWatcher = undefined
    }

    if (this.gitHookManager) {
      this.gitHookManager.dispose()
      this.gitHookManager = undefined
    }
  }
}
