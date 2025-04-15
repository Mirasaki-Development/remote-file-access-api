import appConfig from './resources/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const logLevel = appConfig['log-level'];

const logLevelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function colorize(level: LogLevel, message: string): string {
  const colors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  };
  const reset = '\x1b[0m';
  return `${colors[level]}${message}${reset}`;
}

export class Logger {
  private static shouldLog(level: LogLevel): boolean {
    return logLevelPriority[level] >= logLevelPriority[logLevel];
  }

  public static debug(...args: unknown[]) {
    if (this.shouldLog('debug')) {
      console.debug(colorize('debug', '[DEBUG]'), ...args);
    }
  }

  public static info(...args: unknown[]) {
    if (this.shouldLog('info')) {
      console.info(colorize('info', '[INFO]'), ...args);
    }
  }

  public static warn(...args: unknown[]) {
    if (this.shouldLog('warn')) {
      console.warn(colorize('warn', '[WARN]'), ...args);
    }
  }

  public static error(...args: unknown[]) {
    if (this.shouldLog('error')) {
      console.error(colorize('error', '[ERROR]'), ...args);
    }
  }
}
