/* eslint-disable no-console */
import appConfig from 'modules/shared/services/config/appConfig';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

const LEVEL_ORDER: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel) {
    this.level = level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(this.level);
  }

  private format(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context ? { context } : {}),
    };
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) console.debug(this.format('debug', message, context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('info')) console.info(this.format('info', message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) console.warn(this.format('warn', message, context));
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('error')) console.error(this.format('error', message, context));
  }
}

/** Module-level singleton. */
const logger = new Logger(appConfig.logLevel);

export default logger;
