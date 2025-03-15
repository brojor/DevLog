import type { CommitInfo } from '@devlog/shared'
import type { Repository } from './types/git'

/**
 * Service for retrieving commit information
 */
export class CommitInfoService {
  /**
   * Get information about the HEAD commit in a repository
   * @param repository The Git repository
   * @returns Promise with commit information or undefined
   */
  public async getHeadCommitInfo(repository: Repository): Promise<CommitInfo | undefined> {
    try {
      // Get the latest commit hash
      const commitHash = repository.state.HEAD?.commit
      if (!commitHash) {
        console.log('CommitInfoService: HEAD commit hash not found')
        return undefined
      }

      return this.getCommitInfo(repository, commitHash)
    }
    catch (error) {
      console.error('CommitInfoService: Error getting HEAD commit info:', error)
      return undefined
    }
  }

  /**
   * Get detailed information about a specific commit
   * @param repository The Git repository
   * @param commitHash The commit hash
   * @returns Promise with commit information or undefined
   */
  public async getCommitInfo(repository: Repository, commitHash: string): Promise<CommitInfo | undefined> {
    try {
      // Get commit details
      const commitDetails = await repository.getCommit(commitHash)
      if (!commitDetails) {
        console.log('CommitInfoService: Failed to get commit details')
        return undefined
      }

      // Get repository info
      const repoInfo = this.getRepositoryInfo(repository)
      if (!repoInfo) {
        console.log('CommitInfoService: Failed to get repository information')
        return undefined
      }

      // Create and return commit info
      return {
        message: commitDetails.message,
        timestamp: commitDetails.commitDate?.getTime() || Date.now(),
        hash: commitHash,
        repository: repoInfo,
      }
    }
    catch (error) {
      console.error('CommitInfoService: Error getting commit info:', error)
      return undefined
    }
  }

  /**
   * Extract repository information from a repository
   * @param repository The Git repository
   * @returns Repository information or undefined
   */
  private getRepositoryInfo(repository: Repository): { owner: string, name: string } | undefined {
    try {
      // Get repository remote URL
      const remotes = repository.state.remotes
      if (!remotes || remotes.length === 0) {
        console.log('CommitInfoService: No remote repositories found')
        return undefined
      }

      // Prefer origin remote, otherwise use the first available
      const remote = remotes.find(r => r.name === 'origin') || remotes[0]
      const remoteUrl = remote.fetchUrl || remote.pushUrl

      if (!remoteUrl) {
        console.log('CommitInfoService: Remote repository URL not found')
        return undefined
      }

      // Parse remote URL to get owner and name
      return this.parseRepositoryUrl(remoteUrl)
    }
    catch (error) {
      console.error('CommitInfoService: Error getting repository info:', error)
      return undefined
    }
  }

  /**
   * Parse repository URL to get owner and name
   * @param remoteUrl Repository URL
   * @returns Object containing owner and name, or undefined
   */
  private parseRepositoryUrl(remoteUrl: string): { owner: string, name: string } | undefined {
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

      console.log('CommitInfoService: Failed to parse repository URL:', remoteUrl)
      return undefined
    }
    catch (error) {
      console.error('CommitInfoService: Error parsing repository URL:', error)
      return undefined
    }
  }
}
