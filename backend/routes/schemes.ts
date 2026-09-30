import { Router } from 'express';
import { db } from '../database/store';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { Scheme } from '../types';

export const schemesRouter = Router();

// Public: Get all schemes
schemesRouter.get('/', (req, res) => {
  const schemes = db.getSchemes();
  res.json(schemes);
});

// Public: Get scheme by id or code
schemesRouter.get('/:id', (req, res) => {
  const scheme = db.findSchemeById(req.params.id);
  if (!scheme) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Scheme not found.' } });
  }
  res.json(scheme);
});

// Admin: Create new scheme (e.g. Scheme C wizard)
schemesRouter.post('/', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  const body = req.body;
  if (!body.code || !body.name) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Scheme code and name are required.' } });
  }

  const existing = db.findSchemeById(body.code);
  if (existing) {
    return res.status(400).json({ error: { code: 'DUPLICATE', message: 'Scheme with this code already exists.' } });
  }

  const newScheme: Scheme = {
    id: `scheme_${body.code.toLowerCase()}`,
    code: body.code.toUpperCase(),
    name: body.name,
    fullName: body.fullName || body.name,
    description: body.description || '',
    applicationStart: body.applicationStart || '2025-01-01',
    applicationEnd: body.applicationEnd || '2025-12-31',
    active: body.active !== undefined ? body.active : true,
    totalSeats: body.totalSeats || 500,
    academicYear: body.academicYear || '2025-26',
    formSections: body.formSections || [],
    requiredDocuments: body.requiredDocuments || [],
    eligibilityRules: body.eligibilityRules || [],
    selectionCriteria: body.selectionCriteria || [],
    workflowStages: body.workflowStages || [
      { id: 'stg_1', order: 1, code: 'SUBMITTED', name: 'Application Submitted', description: 'Application filed', assignedRole: 'applicant' },
      { id: 'stg_2', order: 2, code: 'DOC_VERIF', name: 'Document Verification', description: 'Verification by officer', assignedRole: 'officer' },
      { id: 'stg_3', order: 3, code: 'ELIG_EVAL', name: 'Eligibility Review', description: 'Rule evaluation', assignedRole: 'officer' },
      { id: 'stg_4', order: 4, code: 'SCREENING', name: 'Merit Screening', description: 'Scoring and rank', assignedRole: 'selection' },
      { id: 'stg_5', order: 5, code: 'FINAL_DECISION', name: 'Final Selection', description: 'Final award decision', assignedRole: 'selection' },
      { id: 'stg_6', order: 6, code: 'POST_SELECTION', name: 'Post-Selection Monitoring', description: 'Progress monitoring', assignedRole: 'officer' },
    ],
  };

  db.saveScheme(newScheme);

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    action: 'CREATE_SCHEME',
    entityType: 'Scheme',
    entityId: newScheme.id,
    newValue: newScheme,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.status(201).json({ message: 'Scheme created successfully.', scheme: newScheme });
});

// Admin: Update scheme
schemesRouter.put('/:id', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  const scheme = db.findSchemeById(req.params.id);
  if (!scheme) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Scheme not found.' } });
  }

  const prev = { ...scheme };
  const updatedScheme: Scheme = {
    ...scheme,
    ...req.body,
    id: scheme.id, // protect ID
  };

  db.saveScheme(updatedScheme);

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    action: 'UPDATE_SCHEME',
    entityType: 'Scheme',
    entityId: scheme.id,
    previousValue: prev,
    newValue: updatedScheme,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Scheme updated successfully.', scheme: updatedScheme });
});

// Admin: Update eligibility rules
schemesRouter.put('/:id/rules', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  const scheme = db.findSchemeById(req.params.id);
  if (!scheme) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Scheme not found.' } });
  }

  const prevRules = scheme.eligibilityRules;
  scheme.eligibilityRules = req.body.rules || [];
  db.saveScheme(scheme);

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    action: 'UPDATE_SCHEME_RULES',
    entityType: 'Scheme',
    entityId: scheme.id,
    previousValue: prevRules,
    newValue: scheme.eligibilityRules,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Eligibility rules updated successfully.', rules: scheme.eligibilityRules });
});

// Admin: Update required documents
schemesRouter.put('/:id/documents', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  const scheme = db.findSchemeById(req.params.id);
  if (!scheme) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Scheme not found.' } });
  }

  const prevDocs = scheme.requiredDocuments;
  scheme.requiredDocuments = req.body.documents || [];
  db.saveScheme(scheme);

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    action: 'UPDATE_SCHEME_DOCS',
    entityType: 'Scheme',
    entityId: scheme.id,
    previousValue: prevDocs,
    newValue: scheme.requiredDocuments,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Required documents updated successfully.', documents: scheme.requiredDocuments });
});

// Admin: Update selection criteria
schemesRouter.put('/:id/criteria', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  const scheme = db.findSchemeById(req.params.id);
  if (!scheme) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Scheme not found.' } });
  }

  const prevCriteria = scheme.selectionCriteria;
  scheme.selectionCriteria = req.body.criteria || [];
  db.saveScheme(scheme);

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    action: 'UPDATE_SELECTION_CRITERIA',
    entityType: 'Scheme',
    entityId: scheme.id,
    previousValue: prevCriteria,
    newValue: scheme.selectionCriteria,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Selection criteria updated successfully.', criteria: scheme.selectionCriteria });
});
