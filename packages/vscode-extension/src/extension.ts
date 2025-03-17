import * as vscode from 'vscode'
import { ApiClient } from './api/ApiClient'
import { ActivityTrackingService } from './services/ActivityTrackingService'
import { CodeStatsTrackingService } from './services/CodeStatsTrackingService'
import { CommitTrackingService } from './services/CommitTrackingService'

/**
 * Tato metoda je volána při aktivaci rozšíření
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('DevLog rozšíření bylo aktivováno!')

  try {
    // Inicializace základních komponent
    const apiClient = new ApiClient()

    // Inicializace sledování commitů
    const commitTracking = new CommitTrackingService(apiClient)
    await commitTracking.initialize()

    // Inicializace sledování aktivity
    const activityTracking = new ActivityTrackingService(apiClient)

    // Inicializace služby pro sledování statistik kódu
    const codeStatsTracking = new CodeStatsTrackingService(apiClient)

    // Přidáme komponenty do subscriptions pro správné uvolnění zdrojů
    context.subscriptions.push(
      apiClient,
      activityTracking,
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
 * VS Code se postará o dispose všech subscriptions automaticky
 */
export function deactivate() {
  console.log('DevLog rozšíření bylo úspěšně deaktivováno')
}
