import * as vscode from 'vscode'

/**
 * Returns the path to the open workspace
 * @returns The path to the open workspace
 */
export function getWorkspacePath(): string {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders || workspaceFolders.length === 0) {
    throw new Error('No workspace is open')
  }

  return workspaceFolders[0].uri.fsPath
}
