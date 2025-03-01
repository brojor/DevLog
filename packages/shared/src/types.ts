// Typy pro heartbeat
export interface Heartbeat {
  timestamp: number
  source: 'vscode' | 'chrome'
  projectName?: string
}

export interface CodeStats {
  filesChanged: number
  linesAdded: number
  linesRemoved: number
  timestamp: number
}
