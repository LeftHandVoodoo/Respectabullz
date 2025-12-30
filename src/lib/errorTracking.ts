/**
 * Centralized error tracking and logging service for Respectabullz
 * 
 * Provides structured logging with file persistence via Tauri.
 * Falls back to console logging in browser/non-Tauri environments.
 */

import { writeFile, readFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';

// Log levels (ordered by severity)
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Numeric values for level comparison
const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
}

// Configuration
const LOG_DIR = 'logs';
const LOG_FILENAME = 'respectabullz.log';
const MAX_LOG_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_ENTRIES_IN_MEMORY = 1000;

/**
 * Get the minimum log level from environment
 * - Development: 'debug' (show everything)
 * - Production: 'info' (hide debug messages)
 */
function getMinLogLevel(): LogLevel {
  // Check Vite environment variable
  const envLevel = import.meta.env?.VITE_LOG_LEVEL as LogLevel | undefined;
  if (envLevel && LOG_LEVEL_VALUES[envLevel] !== undefined) {
    return envLevel;
  }

  // Default: debug in development, info in production
  return import.meta.env?.DEV ? 'debug' : 'info';
}

/**
 * Check if a log level should be output based on current configuration
 */
function shouldLog(level: LogLevel): boolean {
  const minLevel = getMinLogLevel();
  return LOG_LEVEL_VALUES[level] >= LOG_LEVEL_VALUES[minLevel];
}

// In-memory log buffer for quick access
let logBuffer: LogEntry[] = [];
let isInitialized = false;
let writeQueue: LogEntry[] = [];
let isWriting = false;

/**
 * Check if running in Tauri environment
 */
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Format a log entry as a string for file output
 */
function formatLogEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase().padEnd(5)}]`,
    entry.message,
  ];

  if (entry.error) {
    parts.push(`\n  Error: ${entry.error.name}: ${entry.error.message}`);
    if (entry.error.stack) {
      parts.push(`\n  Stack: ${entry.error.stack.split('\n').slice(0, 5).join('\n         ')}`);
    }
  }

  if (entry.context && Object.keys(entry.context).length > 0) {
    parts.push(`\n  Context: ${JSON.stringify(entry.context)}`);
  }

  return parts.join(' ');
}

/**
 * Initialize the logging system
 */
async function initialize(): Promise<void> {
  if (isInitialized || !isTauriEnvironment()) {
    isInitialized = true;
    return;
  }

  try {
    // Ensure logs directory exists
    const dirExists = await exists(LOG_DIR, { baseDir: BaseDirectory.AppData });
    if (!dirExists) {
      await mkdir(LOG_DIR, { recursive: true, baseDir: BaseDirectory.AppData });
    }
    isInitialized = true;
  } catch (error) {
    console.warn('Failed to initialize log directory:', error);
    isInitialized = true; // Mark as initialized to prevent repeated attempts
  }
}

/**
 * Write queued log entries to file
 */
async function flushWriteQueue(): Promise<void> {
  if (isWriting || writeQueue.length === 0 || !isTauriEnvironment()) {
    return;
  }

  isWriting = true;
  const entriesToWrite = [...writeQueue];
  writeQueue = [];

  try {
    const logPath = `${LOG_DIR}/${LOG_FILENAME}`;
    
    // Check if log file exists and read current content
    let currentContent = '';
    try {
      const fileExists = await exists(logPath, { baseDir: BaseDirectory.AppData });
      if (fileExists) {
        const data = await readFile(logPath, { baseDir: BaseDirectory.AppData });
        currentContent = new TextDecoder().decode(data);
        
        // Check size and rotate if needed
        if (data.length > MAX_LOG_SIZE_BYTES) {
          // Keep only the last half of the log
          const lines = currentContent.split('\n');
          const keepLines = Math.floor(lines.length / 2);
          currentContent = lines.slice(-keepLines).join('\n');
          currentContent = `[${new Date().toISOString()}] [INFO ] Log file rotated (size exceeded ${MAX_LOG_SIZE_BYTES} bytes)\n${currentContent}`;
        }
      }
    } catch {
      // File doesn't exist or can't be read, start fresh
    }

    // Append new entries
    const newContent = entriesToWrite.map(formatLogEntry).join('\n');
    const finalContent = currentContent 
      ? `${currentContent}\n${newContent}` 
      : newContent;

    // Write back to file
    const encoder = new TextEncoder();
    await writeFile(logPath, encoder.encode(finalContent), { baseDir: BaseDirectory.AppData });
  } catch (error) {
    console.error('Failed to write log file:', error);
    // Re-queue failed entries
    writeQueue = [...entriesToWrite, ...writeQueue];
  } finally {
    isWriting = false;
    
    // If more entries were queued during writing, flush again
    if (writeQueue.length > 0) {
      setTimeout(flushWriteQueue, 100);
    }
  }
}

/**
 * Add a log entry
 */
function log(level: LogLevel, message: string, error?: Error, context?: Record<string, unknown>): void {
  // Check if this log level should be output based on environment configuration
  if (!shouldLog(level)) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }),
    ...(context && { context }),
  };

  // Add to memory buffer
  logBuffer.push(entry);
  if (logBuffer.length > MAX_ENTRIES_IN_MEMORY) {
    logBuffer = logBuffer.slice(-MAX_ENTRIES_IN_MEMORY);
  }

  // Console output
  const consoleArgs = [formatLogEntry(entry)];
  switch (level) {
    case 'debug':
      console.debug(...consoleArgs);
      break;
    case 'info':
      console.info(...consoleArgs);
      break;
    case 'warn':
      console.warn(...consoleArgs);
      break;
    case 'error':
      console.error(...consoleArgs);
      break;
  }

  // Queue for file write in Tauri environment
  if (isTauriEnvironment()) {
    writeQueue.push(entry);
    
    // Debounce file writes
    if (!isInitialized) {
      initialize().then(flushWriteQueue);
    } else {
      setTimeout(flushWriteQueue, 100);
    }
  }
}

/**
 * Main logger interface
 */
export const logger = {
  /**
   * Log a debug message (lowest priority, for development)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    log('debug', message, undefined, context);
  },

  /**
   * Log an informational message
   */
  info(message: string, context?: Record<string, unknown>): void {
    log('info', message, undefined, context);
  },

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    log('warn', message, undefined, context);
  },

  /**
   * Log an error with optional Error object and context
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorObj = error instanceof Error ? error : undefined;
    const extraContext = error && !(error instanceof Error) 
      ? { ...context, errorData: error }
      : context;
    log('error', message, errorObj, extraContext);
  },

  /**
   * Get recent log entries from memory
   */
  getRecentLogs(count = 100): LogEntry[] {
    return logBuffer.slice(-count);
  },

  /**
   * Clear in-memory log buffer
   */
  clearBuffer(): void {
    logBuffer = [];
  },

  /**
   * Force flush pending writes to file
   */
  async flush(): Promise<void> {
    await flushWriteQueue();
  },
};

/**
 * Read the full log file content
 */
export async function readLogFile(): Promise<string | null> {
  if (!isTauriEnvironment()) {
    return null;
  }

  try {
    const logPath = `${LOG_DIR}/${LOG_FILENAME}`;
    const fileExists = await exists(logPath, { baseDir: BaseDirectory.AppData });
    if (!fileExists) {
      return null;
    }

    const data = await readFile(logPath, { baseDir: BaseDirectory.AppData });
    return new TextDecoder().decode(data);
  } catch (error) {
    console.error('Failed to read log file:', error);
    return null;
  }
}

/**
 * Clear the log file
 */
export async function clearLogFile(): Promise<boolean> {
  if (!isTauriEnvironment()) {
    return false;
  }

  try {
    const logPath = `${LOG_DIR}/${LOG_FILENAME}`;
    const encoder = new TextEncoder();
    const header = `[${new Date().toISOString()}] [INFO ] Log file cleared\n`;
    await writeFile(logPath, encoder.encode(header), { baseDir: BaseDirectory.AppData });
    logBuffer = [];
    return true;
  } catch (error) {
    console.error('Failed to clear log file:', error);
    return false;
  }
}

/**
 * Export logs as a downloadable text file
 */
export async function exportLogs(): Promise<Uint8Array | null> {
  const content = await readLogFile();
  if (!content) {
    // Fall back to memory buffer
    const memoryContent = logBuffer.map(formatLogEntry).join('\n');
    if (!memoryContent) {
      return null;
    }
    return new TextEncoder().encode(memoryContent);
  }
  return new TextEncoder().encode(content);
}

/**
 * Set up global error handlers
 * Call this once during app initialization
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    logger.error('Unhandled promise rejection', error);
  });

  // Log app startup
  logger.info('Application initialized', {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    isTauri: isTauriEnvironment(),
  });
}
