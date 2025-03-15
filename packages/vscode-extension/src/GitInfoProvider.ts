import type { RepoDetails } from './types'
import type { API, GitExtension, Repository } from './types/git'
import * as vscode from 'vscode'

/**
 * Provider for Git repository information using VS Code Git API
 */
export class GitInfoProvider {
  private gitAPI: API | undefined

  /**
   * Initialize Git API
   * @returns true if initialization was successful
   */
  public initialize(): boolean {
    try {
      const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports
      if (!gitExtension) {
        console.log('GitInfoProvider: Git extension not found')
        return false
      }

      if (!gitExtension.enabled) {
        console.log('GitInfoProvider: Git extension is not enabled')
        return false
      }

      this.gitAPI = gitExtension.getAPI(1)
      console.log('GitInfoProvider: Git API successfully initialized')
      return this.gitAPI !== undefined
    }
    catch (error) {
      console.error('GitInfoProvider: Error initializing Git API:', error)
      return false
    }
  }

  /**
   * Get the Git API instance
   */
  public getGitApi(): API | undefined {
    return this.gitAPI
  }

  /**
   * Get the active repository
   * @returns The active repository or undefined
   */
  public getActiveRepository(): Repository | undefined {
    if (!this.gitAPI) {
      console.log('GitInfoProvider: Git API is not initialized')
      return undefined
    }

    const repositories = this.gitAPI.repositories
    if (!repositories || repositories.length === 0) {
      console.log('GitInfoProvider: No repositories found')
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

  /**
   * Parse repository URL to get owner and name
   * @param remoteUrl Repository URL
   * @returns Object containing owner and name, or undefined
   */
  public parseRepositoryInfo(remoteUrl: string): RepoDetails | undefined {
    try {
      if (!remoteUrl) {
        return undefined
      }

      // Handle different URL formats
      let match

      // Format: https://github.com/owner/repo.git or https://github.com/owner/repo
      match = remoteUrl.match(/https:\/\/github\.com\/([^/]+)\/([^/.]+)(\.git)?$/)
      if (match) {
        return { owner: match[1], name: match[2] }
      }

      // Format: git@github.com:owner/repo.git
      match = remoteUrl.match(/git@github\.com:([^/]+)\/([^/.]+)(\.git)?$/)
      if (match) {
        return { owner: match[1], name: match[2] }
      }

      console.log('GitInfoProvider: Failed to parse repository URL:', remoteUrl)
      return undefined
    }
    catch (error) {
      console.error('GitInfoProvider: Error parsing repository URL:', error)
      return undefined
    }
  }

  /**
   * Get the hash of the latest commit (HEAD)
   * @param repository Git repository
   * @returns Commit hash or undefined
   */
  public getHeadCommitHash(repository: Repository): string | undefined {
    return repository.state.HEAD?.commit
  }

  /**
   * Get detailed commit information
   * @param repository Git repository
   * @param commitHash Commit hash
   * @returns Promise with commit information or undefined
   */
  public async getCommitDetails(repository: Repository, commitHash: string) {
    try {
      return await repository.getCommit(commitHash)
    }
    catch (error) {
      console.error('GitInfoProvider: Error getting commit details:', error)
      return undefined
    }
  }
}
