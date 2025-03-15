import type { API, GitExtension, Repository } from './types/git'
import * as vscode from 'vscode'

/**
 * Provides access to Git repositories
 */
export class GitRepositoryProvider {
  private gitAPI?: API

  constructor() {
    this.initializeGitAPI()
  }

  /**
   * Initialize the Git API
   */
  private initializeGitAPI(): void {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports

    if (!gitExtension?.enabled) {
      throw new Error('Git extension is not available or not enabled')
    }

    this.gitAPI = gitExtension.getAPI(1)
  }

  /**
   * Get repository for current workspace
   */
  public getActiveRepository(): Repository | undefined {
    if (!this.gitAPI) {
      throw new Error('Git API is not initialized')
    }

    const repositories = this.gitAPI.repositories
    if (!repositories.length) {
      return undefined
    }

    // Pro workspace s jedním repozitářem vrátíme první repo
    if (repositories.length === 1) {
      return repositories[0]
    }

    // Pro více repozitářů se pokusíme najít ten, který souvisí s aktivním editorem
    const activeFilePath = vscode.window.activeTextEditor?.document.uri
    if (activeFilePath) {
      const repo = this.gitAPI.getRepository(activeFilePath)
      if (repo) {
        return repo
      }
    }

    // Fallback na první repozitář
    return repositories[0]
  }
}
