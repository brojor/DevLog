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

export interface CodeStatsReport extends CodeStats {
  timestamp: number
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

export interface WindowState {
  focused: boolean
  active: boolean
}

export interface WindowStateEvent {
  windowState: WindowState
  timestamp: number
}

export interface HeartbeatResponse {
  sessionId: string
}
