// Shared constants across all parts of the application

export const TIME_CONSTANTS = {
  // Interval between heartbeats in milliseconds (10 seconds)
  IDE_HEARTBEAT_INTERVAL_MS: 10 * 1000,

  // Timeout for detecting user inactivity in milliseconds (2 minutes)
  INACTIVITY_TIMEOUT_MS: 2 * 60 * 1000,

  // Interval for debouncing code stats reporting in milliseconds (15 seconds)
  CODE_STATS_REPORT_DEBOUNCE_MS: 15 * 1000,
}
