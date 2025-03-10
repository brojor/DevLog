export enum HeartbeatSource {
  VSCODE = 'vscode',
  CHROME = 'chrome',
}

export interface Heartbeat {
  timestamp: number
  source: HeartbeatSource
  projectName?: string
}

export interface CodeStats {
  filesChanged: number
  linesAdded: number
  linesRemoved: number
}

export interface CommitInfo {
  message: string
  timestamp: number
  hash: string
  repository: {
    name: string
    owner: string
  }
}
