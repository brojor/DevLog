import * as vscode from 'vscode'
import { ApiClient } from './ApiClient'
import { CodeStatsTrackingService } from './CodeStatsTrackingService'
import { CommitTrackingService } from './CommitTrackingService'
import { GitStashManager } from './GitStashManager'
import { HeartbeatManager } from './HeartbeatManager'
import { WindowStateManager } from './WindowStateManager'

let apiClient: ApiClient | undefined
let gitStashManager: GitStashManager | undefined
let windowStateManager: WindowStateManager | undefined
let heartbeatManager: HeartbeatManager | undefined
let codeStatsTracking: CodeStatsTrackingService | undefined

/**
 * Tato metoda je volána při aktivaci rozšíření
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('DevLog rozšíření bylo aktivováno!')

  try {
    // Inicializace základních komponent
    apiClient = new ApiClient()
    gitStashManager = new GitStashManager()

    // Inicializace sledování commitů
    const commitTracking = new CommitTrackingService(apiClient)
    await commitTracking.initialize()

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

    // Inicializace služby pro sledování statistik kódu
    codeStatsTracking = new CodeStatsTrackingService(apiClient, gitStashManager)

    // Přidáme komponenty do subscriptions pro správné uvolnění zdrojů
    context.subscriptions.push(
      windowStateManager,
      heartbeatManager,
      codeStatsTracking,
      commitTracking,
    )
    console.log('DevLog rozšíření bylo úspěšně inicializováno')
  }
  catch (error) {
    console.error('Chyba při inicializaci DevLog rozšíření:', error)
    vscode.window.showErrorMessage(`Chyba při inicializaci DevLog: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Tato metoda je volána při deaktivaci rozšíření
 */
export function deactivate() {
  try {
    // Uvolnění zdrojů
    if (windowStateManager) {
      windowStateManager.dispose()
      windowStateManager = undefined
    }

    if (heartbeatManager) {
      heartbeatManager.dispose()
      heartbeatManager = undefined
    }

    if (codeStatsTracking) {
      codeStatsTracking.dispose()
      codeStatsTracking = undefined
    }

    if (gitStashManager) {
      gitStashManager = undefined
    }

    if (apiClient) {
      apiClient = undefined
    }

    console.log('DevLog rozšíření bylo úspěšně deaktivováno')
  }
  catch (error) {
    console.error('Chyba při deaktivaci DevLog rozšíření:', error)
  }
}
