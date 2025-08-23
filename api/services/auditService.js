/**
 * Audit Service
 * Handles audit logging for system operations
 */

const winston = require("winston");

// Configure winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "audit-service" },
  transports: [
    new winston.transports.File({ filename: "logs/audit-error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/audit-combined.log" }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class AuditService {
  constructor() {
    this.logger = logger;
  }

  /**
   * Log an audit event
   */
  async logEvent(eventType, userId, action, details = {}) {
    const auditEvent = {
      eventType,
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      ip: details.ip || "unknown",
      userAgent: details.userAgent || "unknown"
    };

    this.logger.info("Audit Event", auditEvent);
    
    // In a real implementation, this would also save to database
    return auditEvent;
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(eventType, userId, details = {}) {
    return this.logEvent("SECURITY", userId, eventType, {
      ...details,
      severity: "high"
    });
  }

  /**
   * Log a booking event
   */
  async logBookingEvent(eventType, userId, bookingId, details = {}) {
    return this.logEvent("BOOKING", userId, eventType, {
      ...details,
      bookingId
    });
  }

  /**
   * Log a system event
   */
  async logSystemEvent(eventType, details = {}) {
    return this.logEvent("SYSTEM", "system", eventType, details);
  }

  /**
   * Get audit logs (placeholder)
   */
  async getAuditLogs(filters = {}) {
    // In a real implementation, this would query the database
    return [];
  }
}

module.exports = new AuditService();
