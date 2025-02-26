import type { CommitInfo, Heartbeat } from '@toggl-auto-tracker/shared'
import type { ActiveTimeEntry } from '../types'
import { config } from '../config'
import { logger } from '../config/logger'
import { togglService } from './togglService'

class TimeTrackingService {
  // Uchovává informace o aktuálním aktivním time entry
  private activeTimeEntry: ActiveTimeEntry | null = null

  constructor() {
    // Nastavení pravidelné kontroly neaktivity
    this.startInactivityCheck()
    logger.info('TimeTrackingService inicializována')
  }

  // Zpracuje heartbeat a vytvoří/aktualizuje time entry
  async processHeartbeat(heartbeat: Heartbeat): Promise<boolean> {
    const now = new Date()
    const heartbeatTime = new Date(heartbeat.timestamp)

    // Pokud je heartbeat starší než interval heartbeatu + buffer (např. 10 sekund),
    // můžeme ho ignorovat jako zpožděný
    const maxHeartbeatAge = config.app.heartbeatInterval + 10 // v sekundách
    if ((now.getTime() - heartbeatTime.getTime()) / 1000 > maxHeartbeatAge) {
      logger.debug({ heartbeat }, 'Ignorován zpožděný heartbeat')
      return false
    }

    try {
      // Pokud nemáme aktivní time entry, vytvoříme nový
      if (!this.activeTimeEntry) {
        const description = heartbeat.projectName
          ? `Working on ${heartbeat.projectName}`
          : 'Working'

        const newTimeEntry = await togglService.createTimeEntry(description)

        if (!newTimeEntry) {
          logger.error('Nepodařilo se vytvořit time entry')
          return false
        }

        this.activeTimeEntry = {
          id: newTimeEntry.id,
          startTime: new Date(),
          lastHeartbeat: now,
          source: heartbeat.source,
          projectName: heartbeat.projectName,
          description,
        }

        logger.info({ timeEntry: this.activeTimeEntry }, 'Vytvořen nový time entry')
        return true
      }

      // Aktualizujeme čas posledního heartbeatu
      this.activeTimeEntry.lastHeartbeat = now

      // Pokud se změnil projekt, aktualizujeme popis
      if (heartbeat.projectName
        && heartbeat.projectName !== this.activeTimeEntry.projectName) {
        this.activeTimeEntry.projectName = heartbeat.projectName
        const newDescription = `Working on ${heartbeat.projectName}`
        this.activeTimeEntry.description = newDescription

        // Aktualizace time entry v Toggl
        if (this.activeTimeEntry.id) {
          await togglService.updateTimeEntry(this.activeTimeEntry.id, {
            description: newDescription,
          })
        }

        logger.info(
          {
            timeEntryId: this.activeTimeEntry.id,
            projectName: heartbeat.projectName,
          },
          'Aktualizován projekt time entry',
        )
      }

      logger.debug({ heartbeat, activeTimeEntry: this.activeTimeEntry }, 'Heartbeat zpracován')
      return true
    }
    catch (error) {
      logger.error({ error, heartbeat }, 'Chyba při zpracování heartbeatu')
      return false
    }
  }

  // Zpracuje commit a ukončí aktuální time entry
  async processCommit(commitInfo: CommitInfo): Promise<boolean> {
    try {
      if (!this.activeTimeEntry || !this.activeTimeEntry.id) {
        logger.info('Žádný aktivní time entry k ukončení při commitu')
        return false
      }

      // Ukončíme aktuální time entry
      const stoppedEntry = await togglService.stopTimeEntry(this.activeTimeEntry.id)

      if (!stoppedEntry) {
        logger.error({ timeEntryId: this.activeTimeEntry.id }, 'Nepodařilo se ukončit time entry')
        return false
      }

      // Aktualizujeme popis ukončeného time entry podle commit zprávy
      await togglService.updateTimeEntry(this.activeTimeEntry.id, {
        description: commitInfo.message,
      })

      logger.info(
        {
          timeEntryId: this.activeTimeEntry.id,
          commitMessage: commitInfo.message,
        },
        'Time entry ukončen a aktualizován commit zprávou',
      )

      // Vytvoříme nový time entry pro pokračující práci
      const newDescription = this.activeTimeEntry.projectName
        ? `Working on ${this.activeTimeEntry.projectName}`
        : 'Working'

      const newTimeEntry = await togglService.createTimeEntry(newDescription)

      if (!newTimeEntry) {
        logger.error('Nepodařilo se vytvořit nový time entry po commitu')
        this.activeTimeEntry = null
        return true // commit zpracování bylo úspěšné, i když se nepodařilo vytvořit nový entry
      }

      this.activeTimeEntry = {
        id: newTimeEntry.id,
        startTime: new Date(),
        lastHeartbeat: new Date(),
        source: this.activeTimeEntry.source,
        projectName: this.activeTimeEntry.projectName,
        description: newDescription,
      }

      logger.info({ timeEntry: this.activeTimeEntry }, 'Vytvořen nový time entry po commitu')
      return true
    }
    catch (error) {
      logger.error({ error, commitInfo }, 'Chyba při zpracování commitu')
      return false
    }
  }

  // Kontroluje neaktivitu a ukončí time entry, pokud je třeba
  private startInactivityCheck(): void {
    // Kontrola každou minutu
    setInterval(() => {
      this.checkInactivity()
    }, 60 * 1000)

    logger.debug('Zahájena pravidelná kontrola neaktivity')
  }

  private async checkInactivity(): Promise<void> {
    if (!this.activeTimeEntry) {
      return
    }

    const now = new Date()
    const lastHeartbeat = this.activeTimeEntry.lastHeartbeat

    // Pokud jsme neobdrželi heartbeat po dobu delší než inactivityTimeout,
    // ukončíme time entry
    const inactivitySeconds = (now.getTime() - lastHeartbeat.getTime()) / 1000

    if (inactivitySeconds > config.app.inactivityTimeout) {
      logger.info(
        {
          timeEntryId: this.activeTimeEntry.id,
          inactivitySeconds,
          lastHeartbeat: lastHeartbeat.toISOString(),
        },
        'Detekována neaktivita, ukončuji time entry',
      )

      if (this.activeTimeEntry.id) {
        // Ukončíme aktuální time entry
        await togglService.stopTimeEntry(this.activeTimeEntry.id)
      }

      this.activeTimeEntry = null
    }
  }
}

// Exportujeme instanci služby
export const timeTrackingService = new TimeTrackingService()
