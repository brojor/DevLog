import type * as vscode from 'vscode'
import { ApiClient } from './ApiClient'
import { GitStashManager } from './GitStashManager'
import { GitSupportManager } from './GitSupportManager'
import { HeartbeatManager } from './HeartbeatManager'
import { StatsReporter } from './StatsReporter'
import { WindowStateManager } from './WindowStateManager'

let apiClient: ApiClient | undefined
let gitStashManager: GitStashManager | undefined
let windowStateManager: WindowStateManager | undefined
let heartbeatManager: HeartbeatManager | undefined
let statsReporter: StatsReporter | undefined
let gitSupportManager: GitSupportManager | undefined

/**
 * Tato metoda je volána při aktivaci rozšíření
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Toggl Auto Tracker rozšíření bylo aktivováno!')

  // Inicializace komponent
  apiClient = new ApiClient()
  gitStashManager = new GitStashManager()

  // Inicializace sledování stavu okna a heartbeatů
  windowStateManager = new WindowStateManager(apiClient)
  heartbeatManager = new HeartbeatManager(apiClient)

  // Propojení WindowStateManager a HeartbeatManager
  windowStateManager.onStateChange((state) => {
    // Povolit heartbeaty, pokud je okno aktivní a má focus
    heartbeatManager?.setEnabled(state.active && state.focused)
  })

  // Inicializovat HeartbeatManager s aktuálním stavem okna
  const initialState = windowStateManager.state
  heartbeatManager.setEnabled(initialState.active && initialState.focused)

  // Inicializace a spuštění reporteru statistik
  statsReporter = new StatsReporter(gitStashManager, apiClient)
  statsReporter.start()

  // Inicializace podpory pro Git commity
  gitSupportManager = new GitSupportManager(apiClient)
  gitSupportManager.initialize().catch(err =>
    console.error('Chyba při inicializaci Git podpory:', err),
  )

  // Přidáme komponenty do subscriptions
  context.subscriptions.push(
    windowStateManager,
    heartbeatManager,
    statsReporter,
    gitSupportManager,
  )
}

/**
 * Tato metoda je volána při deaktivaci rozšíření
 */
export function deactivate() {
  if (gitSupportManager) {
    gitSupportManager.dispose()
    gitSupportManager = undefined
  }

  if (windowStateManager) {
    windowStateManager.dispose()
    windowStateManager = undefined
  }

  if (heartbeatManager) {
    heartbeatManager.dispose()
    heartbeatManager = undefined
  }

  if (statsReporter) {
    statsReporter.dispose()
    statsReporter = undefined
  }

  if (gitStashManager) {
    gitStashManager = undefined
  }

  if (apiClient) {
    apiClient = undefined
  }

  console.log('Toggl Auto Tracker rozšíření bylo deaktivováno.')
}
