// src/SessionManager.ts

import type * as vscode from 'vscode'
import type { ApiClient } from './ApiClient'
import type { GitStashManager } from './GitStashManager'

/**
 * Třída propojující ApiClient a GitStashManager
 */
export class SessionManager implements vscode.Disposable {
  private readonly apiClient: ApiClient
  private readonly gitStashManager: GitStashManager
  private readonly disposable: vscode.Disposable

  constructor(apiClient: ApiClient, gitStashManager: GitStashManager) {
    this.apiClient = apiClient
    this.gitStashManager = gitStashManager

    // Použijeme arrow funkci místo bind(this)
    this.disposable = this.apiClient.onSessionChange(async (newSessionId: string) => {
      await this.handleSessionChange(newSessionId)
    })
  }

  /**
   * Zpracovává změnu sessionId
   */
  private async handleSessionChange(newSessionId: string): Promise<void> {
    console.log(`SessionManager: Změna sessionId na ${newSessionId}, vytvářím nový stash hash`)

    const stashHash = await this.gitStashManager.createStashHash()

    if (stashHash) {
      console.log(`SessionManager: Vytvořen nový stash hash ${stashHash} pro sessionId ${newSessionId}`)
    }
    else {
      console.warn(`SessionManager: Nepodařilo se vytvořit stash hash pro sessionId ${newSessionId}`)
    }
  }

  /**
   * Získá aktuální stash hash
   */
  public getStashHash(): string | null {
    return this.gitStashManager.getStashHash()
  }

  /**
   * Implementace dispose metody z rozhraní Disposable
   */
  public dispose(): void {
    this.disposable.dispose()
  }
}
