import type { WindowStateEvent } from '@devlog/shared'

/**
 * Tracks time spent in the IDE based on window state changes and heartbeats.
 */
export class IdeTimeTracker {
  private totalTimeInSeconds: number = 0
  private currentInterval: { start: number | null, end: number | null } = { start: null, end: null }
  private lastKeepAliveTimestamp: number | null = null
  private inactivityTimeoutMs: number
  private inactivityTimer: NodeJS.Timeout | null = null

  /**
   * Creates a new IDE time tracker.
   * @param inactivityTimeoutMs Time in milliseconds after which a user is considered inactive without heartbeats
   */
  constructor(inactivityTimeoutMs: number = 120000) {
    this.inactivityTimeoutMs = inactivityTimeoutMs
  }

  /**
   * Processes the window state changes and updates tracking accordingly.
   * @param {WindowStateEvent} windowStateEvent - The event containing the current window state and timestamp.
   * @param {number} windowStateEvent.timestamp - The timestamp of the window state change in milliseconds.
   */
  processWindowState({ windowState, timestamp }: WindowStateEvent): void {
    if (windowState.focused && windowState.active) {
      this.startTracking(timestamp)
    }
    else if (!windowState.focused) {
      this.stopTracking(timestamp)
    }
    else if (!windowState.active && windowState.focused) {
      // Assume inactivity started one minute ago
      const adjustedTimestamp = timestamp - 60_000
      this.stopTracking(adjustedTimestamp)
    }
  }

  /**
   * Updates the last activity time (called on each heartbeat).
   * @param timestamp Unix timestamp (in milliseconds) of the heartbeat
   */
  keepAlive(timestamp: number): void {
    this.lastKeepAliveTimestamp = timestamp

    this.scheduleInactivityCheck()
  }

  /**
   * Resets the tracker - zeroes counters and starts a new interval.
   * Called after a session ends or when a new session starts.
   */
  reset(): void {
    this.clearInactivityTimer()

    this.totalTimeInSeconds = 0

    // Start a new tracking interval
    const now = Date.now()
    this.currentInterval = { start: now, end: null }
    this.lastKeepAliveTimestamp = now

    this.scheduleInactivityCheck()
  }

  /**
   * Returns the total tracked time in seconds.
   */
  get timeInMinutes(): number {
    if (!this.currentInterval.start || !this.lastKeepAliveTimestamp) {
      return Math.round(this.totalTimeInSeconds / 60)
    }

    const currentDurationMs = this.lastKeepAliveTimestamp - this.currentInterval.start
    const currentDurationSec = Math.max(0, Math.floor(currentDurationMs / 1000))

    return Math.round((this.totalTimeInSeconds + currentDurationSec) / 60)
  }

  /**
   * Starts a new tracking interval.
   * @param timestamp Time to start tracking from in milliseconds
   */
  private startTracking(timestamp: number): void {
    if (this.currentInterval.start) {
      return
    }

    this.currentInterval.start = timestamp
    this.currentInterval.end = null
    this.lastKeepAliveTimestamp = timestamp

    this.scheduleInactivityCheck()
  }

  /**
   * Clears the inactivity timer if it exists.
   */
  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
      this.inactivityTimer = null
    }
  }

  private scheduleInactivityCheck(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }

    this.inactivityTimer = setTimeout(() => {
      if (this.lastKeepAliveTimestamp) {
        this.stopTracking(this.lastKeepAliveTimestamp)
      }
    }, this.inactivityTimeoutMs)
  }

  /**
   * Stops the current tracking interval and adds its duration to the total time.
   * @param timestamp Time to stop tracking at in milliseconds
   */
  private stopTracking(timestamp: number): void {
    if (!this.currentInterval.start) {
      return
    }

    this.clearInactivityTimer()

    this.currentInterval.end = timestamp

    const intervalDurationMs = this.currentInterval.end - this.currentInterval.start
    const intervalDurationSec = Math.floor(intervalDurationMs / 1000)

    this.totalTimeInSeconds += intervalDurationSec

    this.currentInterval.start = null
    this.currentInterval.end = null
  }
}
