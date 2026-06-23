/**
 * Logger utility using Winston
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';

const { combine, timestamp, printf, colorize, align } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Default logger configuration
let logger = null;

/**
 * Initialize logger
 */
export function initLogger(options = {}) {
  const {
    logLevel = process.env.LOG_LEVEL || 'info',
    logDir = './logs',
    enableFile = true,
    enableConsole = true
  } = options;

  // Ensure log directory exists
  if (enableFile) {
    fs.ensureDirSync(logDir);
  }

  const transports = [];

  // Console transport
  if (enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: combine(
          colorize(),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          align(),
          logFormat
        )
      })
    );
  }

  // File transport
  if (enableFile) {
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          logFormat
        )
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          logFormat
        )
      })
    );
  }

  logger = winston.createLogger({
    level: logLevel,
    transports
  });

  return logger;
}

/**
 * Get logger instance (creates default if not initialized)
 */
export function getLogger() {
  if (!logger) {
    logger = initLogger();
  }
  return logger;
}

/**
 * Simple console logger with emojis
 */
export const consoleLogger = {
  info: (message) => console.log(`ℹ️  ${message}`),
  success: (message) => console.log(`✅ ${message}`),
  warn: (message) => console.warn(`⚠️  ${message}`),
  error: (message) => console.error(`❌ ${message}`),
  debug: (message) => console.log(`🔍 ${message}`),
  progress: (message) => console.log(`⏳ ${message}`),
  download: (message) => console.log(`📥 ${message}`),
  crawl: (message) => console.log(`🕷️  ${message}`),
  auth: (message) => console.log(`🔐 ${message}`),
  extract: (message) => console.log(`📄 ${message}`)
};

export default { initLogger, getLogger, consoleLogger };
