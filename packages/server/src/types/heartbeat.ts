export enum HeartbeatSource {
  VSCODE = 'vscode',
  CHROME = 'chrome',
}

export interface Heartbeat {
  source: HeartbeatSource
  timestamp?: number
}
