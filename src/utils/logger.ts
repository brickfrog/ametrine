/**
 * Development-aware logging utility
 * Only logs in development mode (except errors which always log)
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log informational messages (only in development)
   */
  info: (message: string, ...args: unknown[]): void => {
    if (isDev) {
      console.log(message, ...args);
    }
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (message: string, ...args: unknown[]): void => {
    if (isDev) {
      console.warn(message, ...args);
    }
  },

  /**
   * Log error messages (always logs, even in production)
   */
  error: (message: string, ...args: unknown[]): void => {
    console.error(message, ...args);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (message: string, ...args: unknown[]): void => {
    if (isDev) {
      console.debug(message, ...args);
    }
  },
};
