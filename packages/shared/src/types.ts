// Typy pro heartbeat
export interface Heartbeat {
  timestamp: number
  source: 'vscode' | 'chrome'
  // Základní informace, které rozšíříme později podle potřeby
  projectName?: string
}

// Typy pro Git commit
export interface CommitInfo {
  message: string
  timestamp: number
}
