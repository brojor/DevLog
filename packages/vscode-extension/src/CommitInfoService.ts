import type { CommitInfo } from '@devlog/shared'
import type { RepoDetails } from './types'
import type { Repository } from './types/git'

/**
 * Service for retrieving commit information
 */
export class CommitInfoService {
  /**
   * Get information about a commit (defaults to HEAD if no hash provided)
   */
  public async getCommitInfo(
    repository: Repository,
    commitHash?: string,
  ): Promise<CommitInfo | undefined> {
    try {
      // If no hash provided, try to get HEAD commit hash
      if (!commitHash) {
        commitHash = repository.state.HEAD?.commit
        if (!commitHash) {
          console.log('CommitInfoService: No commit hash available')
          return undefined
        }
      }

      // Get commit details
      const commitDetails = await repository.getCommit(commitHash)
      if (!commitDetails) {
        console.log('CommitInfoService: Failed to get commit details')
        return undefined
      }

      // Get repository info
      const repoInfo = this.getRepositoryInfo(repository)
      if (!repoInfo)
        return undefined

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

  private getRepositoryInfo(repository: Repository): RepoDetails | undefined {
    const remote = this.getPreferredRemote(repository)
    if (!remote?.fetchUrl && !remote?.pushUrl) {
      console.log('CommitInfoService: No valid remote URL found')
      return undefined
    }

    const remoteUrl = remote.fetchUrl || remote.pushUrl
    return this.parseRepositoryUrl(remoteUrl!)
  }

  private getPreferredRemote(repository: Repository) {
    const remotes = repository.state.remotes
    if (!remotes?.length)
      return undefined

    // Prefer 'origin', fallback to first remote
    return remotes.find(r => r.name === 'origin') || remotes[0]
  }

  private parseRepositoryUrl(remoteUrl: string): RepoDetails | undefined {
    // Jednotný regex pro oba formáty URL
    const regex = /(?:https:\/\/github\.com\/|git@github\.com:)([^/]+)\/([^/.]+)(?:\.git)?$/
    const match = remoteUrl.match(regex)

    if (!match) {
      console.log('CommitInfoService: Invalid repository URL format:', remoteUrl)
      return undefined
    }

    return {
      owner: match[1],
      name: match[2],
    }
  }
}
