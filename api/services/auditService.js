/**
 * Audit Service
 * Logs all system changes to audit_logs table for compliance and debugging
 */

const { v4: uuidv4 } = require('uuid');
const pool = require('../lib/db');

/**
 * Log an audit event
 * If client is provided, uses that connection; otherwise uses pool
 */
async function logAudit(client, auditData) {
  try {
    const {
      entity_type,
      entity_id,
      entity_name,
      action,
      old_values,
      new_values,
      changed_fields,
      user_id,
      user_email,
      user_role,
      request_id,
      request_ip,
      request_user_agent,
      status = 'success',
      error_message,
    } = auditData;

    const query = `
      INSERT INTO audit_logs (
        entity_type, entity_id, entity_name, action,
        old_values, new_values, changed_fields,
        user_id, user_email, user_role,
        request_id, request_ip, request_user_agent,
        status, error_message, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()
      )
    `;

    const values = [
      entity_type,
      entity_id,
      entity_name,
      action,
      old_values ? JSON.stringify(old_values) : null,
      new_values ? JSON.stringify(new_values) : null,
      changed_fields ? `{${changed_fields.join(',')}}` : null,
      user_id || null,
      user_email || 'system',
      user_role || 'system',
      request_id || uuidv4(),
      request_ip || null,
      request_user_agent || null,
      status,
      error_message || null,
    ];

    if (client) {
      await client.query(query, values);
    } else {
      await pool.query(query, values);
    }

    return true;
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw - audit failures shouldn't break main operations
    return false;
  }
}

/**
 * Get audit logs for an entity
 */
async function getAuditLogs(entityType, entityId, limit = 50) {
  try {
    const result = await pool.query(
      `SELECT 
        id, entity_type, entity_id, entity_name, action,
        old_values, new_values, changed_fields,
        user_id, user_email, user_role,
        request_id, status, error_message, created_at
      FROM audit_logs
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY created_at DESC
      LIMIT $3`,
      [entityType, entityId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Get audit logs error:', error);
    return [];
  }
}

/**
 * Get recent audit logs (for admin dashboard)
 */
async function getRecentAuditLogs(limit = 100, offset = 0) {
  try {
    const result = await pool.query(
      `SELECT 
        id, entity_type, entity_id, entity_name, action,
        user_email, user_role, request_id, status, error_message, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  } catch (error) {
    console.error('Get recent audit logs error:', error);
    return [];
  }
}

/**
 * Search audit logs
 */
async function searchAuditLogs(filters = {}) {
  try {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.entity_type) {
      query += ` AND entity_type = $${paramCount++}`;
      values.push(filters.entity_type);
    }

    if (filters.action) {
      query += ` AND action = $${paramCount++}`;
      values.push(filters.action);
    }

    if (filters.user_email) {
      query += ` AND user_email = $${paramCount++}`;
      values.push(filters.user_email);
    }

    if (filters.status) {
      query += ` AND status = $${paramCount++}`;
      values.push(filters.status);
    }

    if (filters.from_date) {
      query += ` AND created_at >= $${paramCount++}`;
      values.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ` AND created_at <= $${paramCount++}`;
      values.push(filters.to_date);
    }

    query += ` ORDER BY created_at DESC LIMIT ${filters.limit || 50}`;

    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Search audit logs error:', error);
    return [];
  }
}

module.exports = {
  logAudit,
  getAuditLogs,
  getRecentAuditLogs,
  searchAuditLogs,
};
