import type { API, GitExtension, Repository } from './git'
import type { StatsReporter } from './StatsReporter'
import * as vscode from 'vscode'

export class GitCommitTracker implements vscode.Disposable {
  private disposables: vscode.Disposable[] = []

  constructor(private readonly statsReporter: StatsReporter) {
    this.initialize()
  }

  private initialize() {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')

    if (!gitExtension) {
      console.error('Git extension is not installed')
      return
    }

    const git = gitExtension.exports.getAPI(1)
    this.setupRepositoryWatcher(git)
  }

  private setupRepositoryWatcher(git: API) {
    const repositoryListener = git.onDidOpenRepository((repo) => {
      this.watchRepositoryCommits(repo)
    })
    this.disposables.push(repositoryListener)
  }

  private watchRepositoryCommits(repo: Repository) {
    const commitListener = repo.onDidCommit(() => {
      this.onCommitMade()
    })
    this.disposables.push(commitListener)
  }

  private onCommitMade() {
    void this.statsReporter.forceReportStats()
  }

  dispose() {
    this.disposables.forEach(d => d.dispose())
    this.disposables = []
  }
}
