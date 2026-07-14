/**
 * Centralized error tracking and logging service for Respectabullz
 * 
 * Provides structured logging with file persistence via Tauri.
 * Falls back to console logging in browser/non-Tauri environments.
 */

import { readFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { atomicWriteFile } from '@/lib/fsUtils';

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
const MAX_LOG_STRING_LENGTH = 1000;
const MAX_CONTEXT_DEPTH = 3;
const REDACTED = '[redacted]';
const SENSITIVE_CONTEXT_KEY = /(address|authorization|buyer|breeder|client|contact|content|credential|data|destination|email|file|filename|name|notes|password|path|phone|record|secret|source|text|token|variables)/i;

/**
 * Redact common secrets, contact details, identifiers, and local paths before
 * any value reaches the console, in-memory buffer, or persisted log file.
 */
export function sanitizeLogString(value: string): string {
  const sanitized = value
    .replace(/\0/g, '')
    .replace(/\bgithub_pat_[A-Za-z0-9_]+\b/gi, '[redacted credential]')
    .replace(/\bgh[pousr]_[A-Za-z0-9]+\b/gi, '[redacted credential]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi, 'Bearer [redacted credential]')
    .replace(
      /\b(api[_ -]?key|access[_ -]?token|auth(?:orization)?|password|secret)\s*[:=]\s*["']?[^\s"'`]+/gi,
      (_match, label: string) => `${label}: [redacted credential]`
    )
    .replace(/file:\/\/[A-Za-z]:\/[^\s)\]}]+/gi, '[redacted filesystem path]')
    .replace(/\b[A-Za-z]:[\\/](?:[^\\/:*?"<>|\r\n]+[\\/])*[^\\/:*?"<>|\s\r\n]*/g, '[redacted filesystem path]')
    .replace(/\\\\[^\\\s]+\\[^\r\n]+/g, '[redacted filesystem path]')
    .replace(/\/(?:Users|home)\/[^/\s]+(?:\/[^\s)\]}]+)?/g, '[redacted filesystem path]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted contact]')
    .replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g, '[redacted contact]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '[redacted identifier]');

  return sanitized.length > MAX_LOG_STRING_LENGTH
    ? `${sanitized.slice(0, MAX_LOG_STRING_LENGTH)}…[truncated]`
    : sanitized;
}

function sanitizeLogValue(
  value: unknown,
  key: string,
  depth: number,
  seen: WeakSet<object>
): unknown {
  if (SENSITIVE_CONTEXT_KEY.test(key)) {
    return REDACTED;
  }
  if (value == null || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return sanitizeLogString(value);
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value !== 'object') {
    return `[${typeof value}]`;
  }
  if (depth >= MAX_CONTEXT_DEPTH) {
    return '[redacted nested value]';
  }
  if (seen.has(value)) {
    return '[circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((item) => sanitizeLogValue(item, '', depth + 1, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      sanitizeLogValue(entryValue, entryKey, depth + 1, seen),
    ])
  );
}

export function sanitizeLogContext(
  context?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!context) return undefined;
  return sanitizeLogValue(context, '', 0, new WeakSet<object>()) as Record<string, unknown>;
}

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
let fileOperationChain: Promise<void> = Promise.resolve();

function enqueueFileOperation(operation: () => Promise<void>): Promise<void> {
  const queued = fileOperationChain.then(operation);
  // Keep the serialization chain usable after a failed operation while still
  // returning the original rejection to its caller.
  fileOperationChain = queued.catch(() => undefined);
  return queued;
}

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
 *
 * This function addresses potential TOCTOU race conditions by:
 * 1. Reading file content first and catching errors if file doesn't exist (no separate exists check)
 * 2. Using atomic write (write-to-temp-then-rename) to prevent corruption
 *
 * In a single-user desktop app, concurrent access is minimal, but atomic writes
 * ensure data integrity if the app crashes or is closed during write.
 */
async function flushWriteQueue(): Promise<void> {
  if (writeQueue.length === 0 || !isTauriEnvironment()) {
    return;
  }

  const entriesToWrite = [...writeQueue];
  writeQueue = [];

  try {
    await enqueueFileOperation(async () => {
      const logPath = `${LOG_DIR}/${LOG_FILENAME}`;

      // Read current content directly - no separate exists check to avoid TOCTOU
      // If file doesn't exist, we catch the error and start fresh
      let currentContent = '';
      try {
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
      } catch {
        // File doesn't exist or can't be read, start fresh
        // This is expected on first run or after log file deletion
      }

      // Append new entries
      const newContent = entriesToWrite.map(formatLogEntry).join('\n');
      const finalContent = currentContent
        ? `${currentContent}\n${newContent}`
        : newContent;

      // Write atomically to prevent corruption if interrupted
      await atomicWriteFile(logPath, finalContent, { baseDir: BaseDirectory.AppData });
    });
  } catch (error) {
    console.error('Failed to write log file:', error);
    // Re-queue failed entries
    writeQueue = [...entriesToWrite, ...writeQueue];
  }

  // If more entries were queued during writing, serialize another flush.
  if (writeQueue.length > 0) {
    await flushWriteQueue();
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
    message: sanitizeLogString(message),
    ...(error && {
      error: {
        name: sanitizeLogString(error.name),
        message: sanitizeLogString(error.message),
        stack: error.stack ? sanitizeLogString(error.stack) : undefined,
      },
    }),
    ...(context && { context: sanitizeLogContext(context) }),
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
    const header = `[${new Date().toISOString()}] [INFO ] Log file cleared\n`;
    // Define the clear boundary immediately. A flush already in the serialized
    // chain finishes first, then this write replaces it; new entries queued
    // after this call are flushed after the clear operation.
    writeQueue = [];
    logBuffer = [];
    await enqueueFileOperation(() =>
      atomicWriteFile(logPath, header, { baseDir: BaseDirectory.AppData }),
    );
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
  await flushWriteQueue();
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
