import { Router } from 'express';
import { db } from '../database/store';
import { authenticate, requireRole } from '../middleware/auth';

export const auditLogsRouter = Router();

// Get audit logs
auditLogsRouter.get('/', authenticate, requireRole(['admin', 'officer']), (req, res) => {
  const { action, userEmail, entityType, search } = req.query;
  let logs = db.getAuditLogs();

  if (action) {
    logs = logs.filter((l) => l.action === action);
  }
  if (userEmail) {
    logs = logs.filter((l) => l.userEmail.toLowerCase().includes(String(userEmail).toLowerCase()));
  }
  if (entityType) {
    logs = logs.filter((l) => l.entityType === entityType);
  }
  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.userEmail.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q)
    );
  }

  res.json(logs);
});

// Export Audit Logs as CSV
auditLogsRouter.get('/export-csv', authenticate, requireRole(['admin']), (req, res) => {
  const logs = db.getAuditLogs();
  const header = ['Timestamp', 'User Email', 'Role', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'New Value'];
  const rows = logs.map((l) => [
    `"${l.timestamp}"`,
    `"${l.userEmail}"`,
    `"${l.userRole}"`,
    `"${l.action}"`,
    `"${l.entityType}"`,
    `"${l.entityId}"`,
    `"${l.ipAddress}"`,
    `"${JSON.stringify(l.newValue || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${Date.now()}.csv"`);
  return res.send(csv);
});
