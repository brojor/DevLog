import type { API, GitExtension, Repository } from './types/git'
import * as vscode from 'vscode'

/**
 * Provides access to Git repositories
 */
export class GitRepositoryProvider {
  private gitAPI: API | undefined

  /**
   * Initialize the Git API
   * @returns true if initialization was successful
   */
  public initialize(): boolean {
    try {
      const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports
      if (!gitExtension) {
        console.log('GitRepositoryProvider: Git extension not found')
        return false
      }

      if (!gitExtension.enabled) {
        console.log('GitRepositoryProvider: Git extension is not enabled')
        return false
      }

      this.gitAPI = gitExtension.getAPI(1)
      console.log('GitRepositoryProvider: Git API successfully initialized')
      return this.gitAPI !== undefined
    }
    catch (error) {
      console.error('GitRepositoryProvider: Error initializing Git API:', error)
      return false
    }
  }

  /**
   * Get the active repository
   * @returns The active repository or undefined
   */
  public getActiveRepository(): Repository | undefined {
    if (!this.gitAPI) {
      console.log('GitRepositoryProvider: Git API is not initialized')
      return undefined
    }

    const repositories = this.gitAPI.repositories
    if (!repositories || repositories.length === 0) {
      console.log('GitRepositoryProvider: No repositories found')
      return undefined
    }

    // If there's only one repository, return it
    if (repositories.length === 1) {
      return repositories[0]
    }

    // Otherwise, try to find the repository related to the active editor
    const activeEditor = vscode.window.activeTextEditor
    if (activeEditor) {
      const activePath = activeEditor.document.uri
      const repo = this.gitAPI.getRepository(activePath)
      if (repo) {
        return repo
      }
    }

    // If there's no active editor or repository not found, return the first one
    return repositories[0]
  }
}
