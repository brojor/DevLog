import type { FSWatcher } from 'node:fs'
import type { Disposable } from 'vscode'
import { constants, watch } from 'node:fs'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/**
 * Listens for commit events via signal file
 */
export class CommitEventListener implements Disposable {
  private fsWatcher: FSWatcher | null = null
  private readonly signalFile: string

  constructor(
    rootPath: string,
    private readonly onCommitDetected: () => void,
  ) {
    this.signalFile = join(rootPath, '.git', '.commit.done')
  }

  /**
   * Nastaví sledování commit signálu
   */
  public async initialize(): Promise<void> {
    await this.ensureSignalFile()
    this.startWatching()
  }

  private async ensureSignalFile(): Promise<void> {
    await mkdir(dirname(this.signalFile), { recursive: true })

    try {
      await access(this.signalFile, constants.F_OK)
    }
    catch {
      await writeFile(this.signalFile, '')
    }
  }

  private startWatching(): void {
    if (this.fsWatcher) {
      return
    }

    this.fsWatcher = watch(
      this.signalFile,
      () => this.onCommitDetected(),
    )
  }

  public dispose(): void {
    this.fsWatcher?.close()
    this.fsWatcher = null
  }
}
