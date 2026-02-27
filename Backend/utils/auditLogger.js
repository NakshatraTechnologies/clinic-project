/**
 * Audit Logger Utility
 *
 * Creates audit log entries for appointment state changes.
 * Each entry records who did what, when, and the before/after values.
 */

/**
 * Create an audit log entry object
 *
 * @param {string} action - Action type (created, confirmed, cancelled, rescheduled, completed, no-show, payment)
 * @param {string} performedById - User ID who performed the action
 * @param {string} [details=''] - Human-readable description
 * @param {string} [oldValue=''] - Previous state/value
 * @param {string} [newValue=''] - New state/value
 * @returns {Object} Audit log entry
 */
const createAuditEntry = (action, performedById, details = '', oldValue = '', newValue = '') => {
  return {
    action,
    performedBy: performedById,
    timestamp: new Date(),
    details,
    oldValue,
    newValue,
  };
};

/**
 * Push an audit entry onto an appointment's auditLog array
 *
 * @param {Object} appointment - Mongoose appointment document
 * @param {string} action - Action type
 * @param {string} performedById - User ID
 * @param {string} [details=''] - Description
 * @param {string} [oldValue=''] - Previous value
 * @param {string} [newValue=''] - New value
 */
const addAuditLog = (appointment, action, performedById, details = '', oldValue = '', newValue = '') => {
  if (!appointment.auditLog) {
    appointment.auditLog = [];
  }
  appointment.auditLog.push(
    createAuditEntry(action, performedById, details, oldValue, newValue)
  );
};

module.exports = {
  createAuditEntry,
  addAuditLog,
};
