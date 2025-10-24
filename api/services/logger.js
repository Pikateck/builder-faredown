const winston = require("winston");

/**
 * Create a configured winston logger with standardized format
 * @param {string} label - Service or component label
 * @returns {winston.Logger} Configured logger instance
 */
function createLogger(label = "APP") {
  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr =
          Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
        return `${timestamp} [${level.toUpperCase()}] [${label}] ${message}${metaStr}`;
      }),
    ),
    transports: [new winston.transports.Console()],
  });
}

// Default logger for modules that import this service
const logger = createLogger("REDIS");

module.exports = logger;
module.exports.createLogger = createLogger;
