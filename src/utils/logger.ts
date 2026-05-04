import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';

/**
 * 设置日志级别
 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

/**
 * 获取当前日志级别
 */
export function getLogLevel(): LogLevel {
  return currentLevel;
}

/**
 * 判断是否应该输出日志
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

/**
 * 格式化日志消息
 */
function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return `${prefix} ${message}`;
}

/**
 * 调试日志
 */
export function debug(message: string, ...args: unknown[]): void {
  if (shouldLog('debug')) {
    console.debug(chalk.gray(formatMessage('debug', message)), ...args);
  }
}

/**
 * 信息日志
 */
export function info(message: string, ...args: unknown[]): void {
  if (shouldLog('info')) {
    console.log(chalk.blue(formatMessage('info', message)), ...args);
  }
}

/**
 * 警告日志
 */
export function warn(message: string, ...args: unknown[]): void {
  if (shouldLog('warn')) {
    console.warn(chalk.yellow(formatMessage('warn', message)), ...args);
  }
}

/**
 * 错误日志
 */
export function error(message: string, ...args: unknown[]): void {
  if (shouldLog('error')) {
    console.error(chalk.red(formatMessage('error', message)), ...args);
  }
}

/**
 * 创建子日志器
 */
export function createLogger(prefix: string) {
  return {
    debug: (message: string, ...args: unknown[]) => debug(`[${prefix}] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => info(`[${prefix}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => warn(`[${prefix}] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => error(`[${prefix}] ${message}`, ...args),
  };
}

// 导出默认日志器
export const logger = {
  debug,
  info,
  warn,
  error,
  setLogLevel,
  getLogLevel,
  createLogger,
};

export default logger;
