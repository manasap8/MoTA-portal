import { Router } from 'express';
import { db } from '../database/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { Deficiency } from '../types';

export const deficienciesRouter = Router();

// List deficiencies
deficienciesRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { applicationId } = req.query;

  let defs = db.getAllDeficiencies();
  if (applicationId) {
    defs = defs.filter((d) => d.applicationId === applicationId);
  } else if (user.role === 'applicant') {
    const profile = db.findApplicantByUserId(user.id);
    const myAppIds = new Set(
      db
        .getApplications()
        .filter((a) => a.applicantId === profile?.id || a.applicantEmail === user.email)
        .map((a) => a.id)
    );
    defs = defs.filter((d) => myAppIds.has(d.applicationId));
  }

  res.json(defs);
});

// Officer: Raise deficiency
deficienciesRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role === 'applicant') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only officers can raise deficiencies.' } });
  }

  const { applicationId, documentId, category, title, description, linkedField, dueDate } = req.body;
  if (!applicationId || !title || !description) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Title, description and application ID are required.' } });
  }

  const app = db.findApplicationById(applicationId);
  if (!app) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }

  const defId = `def_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const newDef: Deficiency = {
    id: defId,
    applicationId: app.id,
    documentId,
    category: category || 'Clarification Required',
    title,
    description,
    linkedField,
    dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Open',
    raisedBy: user.fullName,
    raisedAt: new Date().toISOString(),
    history: [
      {
        id: `hist_${Date.now()}`,
        action: 'Deficiency Raised',
        actorName: user.fullName,
        actorRole: user.role,
        remarks: description,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  db.saveDeficiency(newDef);

  // Mark application status as Deficient
  app.status = 'Deficient';
  app.lastUpdatedAt = new Date().toISOString();
  db.saveApplication(app);

  // Notify applicant
  const applicantUser = db.findUserByEmail(app.applicantEmail);
  if (applicantUser) {
    db.addNotification({
      id: `notif_${Date.now()}`,
      userId: applicantUser.id,
      title: `Deficiency Raised: ${title}`,
      message: `Officer ${user.fullName} raised a deficiency on your application ${app.applicationNumber}: ${description}. Due: ${newDef.dueDate}`,
      type: 'warning',
      relatedApplicationId: app.id,
      linkUrl: `/applicant/deficiencies`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'RAISE_DEFICIENCY',
    entityType: 'Deficiency',
    entityId: newDef.id,
    newValue: newDef,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.status(201).json({ message: 'Deficiency raised successfully.', deficiency: newDef });
});

// Applicant: Resubmit resolution
deficienciesRouter.post('/:id/resubmit', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const def = db.findDeficiencyById(req.params.id);
  if (!def) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Deficiency not found.' } });
  }

  const { remarks, correctedValue } = req.body;

  def.status = 'Resubmitted';
  def.history.push({
    id: `hist_${Date.now()}`,
    action: 'Resolution Submitted',
    actorName: user.fullName,
    actorRole: user.role,
    remarks: remarks || 'Applicant uploaded updated document or corrected details.',
    createdAt: new Date().toISOString(),
  });

  // If corrected field value was sent
  if (def.linkedField && correctedValue !== undefined) {
    const app = db.findApplicationById(def.applicationId);
    if (app) {
      app.data = { ...(app.data || {}), [def.linkedField]: correctedValue };
      app.lastUpdatedAt = new Date().toISOString();
      db.saveApplication(app);
    }
  }

  db.saveDeficiency(def);

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'RESUBMIT_DEFICIENCY',
    entityType: 'Deficiency',
    entityId: def.id,
    newValue: { remarks, correctedValue },
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Deficiency resolution submitted for officer review.', deficiency: def });
});

// Officer: Resolve deficiency
deficienciesRouter.post('/:id/resolve', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role === 'applicant') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only officers can resolve deficiencies.' } });
  }

  const def = db.findDeficiencyById(req.params.id);
  if (!def) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Deficiency not found.' } });
  }

  const remarks = req.body.remarks || 'Accepted resolution as satisfactory.';
  def.status = 'Resolved';
  def.resolvedAt = new Date().toISOString();
  def.resolutionRemarks = remarks;
  def.history.push({
    id: `hist_${Date.now()}`,
    action: 'Deficiency Resolved & Accepted',
    actorName: user.fullName,
    actorRole: user.role,
    remarks,
    createdAt: new Date().toISOString(),
  });

  db.saveDeficiency(def);

  // Check if all deficiencies for this application are now resolved
  const app = db.findApplicationById(def.applicationId);
  if (app) {
    const remainingOpen = db.getDeficienciesByApplicationId(app.id).filter((d) => d.status !== 'Resolved');
    if (remainingOpen.length === 0 && app.status === 'Deficient') {
      app.status = 'Under Verification';
      app.lastUpdatedAt = new Date().toISOString();
      db.saveApplication(app);
    }

    const applicantUser = db.findUserByEmail(app.applicantEmail);
    if (applicantUser) {
      db.addNotification({
        id: `notif_${Date.now()}`,
        userId: applicantUser.id,
        title: `Deficiency Resolved: ${def.title}`,
        message: `Officer ${user.fullName} accepted your deficiency resolution.`,
        type: 'success',
        relatedApplicationId: app.id,
        linkUrl: `/applicant/applications/${app.id}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'RESOLVE_DEFICIENCY',
    entityType: 'Deficiency',
    entityId: def.id,
    newValue: { status: 'Resolved', remarks },
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Deficiency marked as Resolved.', deficiency: def });
});

// Officer: Reject deficiency resolution
deficienciesRouter.post('/:id/reject', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role === 'applicant') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only officers can reject deficiency resolutions.' } });
  }

  const def = db.findDeficiencyById(req.params.id);
  if (!def) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Deficiency not found.' } });
  }

  const { remarks } = req.body;
  if (!remarks) {
    return res.status(400).json({ error: { code: 'REMARKS_REQUIRED', message: 'Clarification / rejection remarks are required.' } });
  }

  def.status = 'Open';
  def.history.push({
    id: `hist_${Date.now()}`,
    action: 'Resolution Rejected (Further Clarification Required)',
    actorName: user.fullName,
    actorRole: user.role,
    remarks,
    createdAt: new Date().toISOString(),
  });

  db.saveDeficiency(def);

  const app = db.findApplicationById(def.applicationId);
  if (app) {
    app.status = 'Deficient';
    db.saveApplication(app);

    const applicantUser = db.findUserByEmail(app.applicantEmail);
    if (applicantUser) {
      db.addNotification({
        id: `notif_${Date.now()}`,
        userId: applicantUser.id,
        title: `Further Clarification Needed: ${def.title}`,
        message: `Officer noted your resolution is insufficient: ${remarks}. Please upload valid evidence.`,
        type: 'danger',
        relatedApplicationId: app.id,
        linkUrl: `/applicant/deficiencies`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'REJECT_DEFICIENCY_RESOLUTION',
    entityType: 'Deficiency',
    entityId: def.id,
    newValue: { status: 'Open', remarks },
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Resolution rejected, deficiency returned to Open status.', deficiency: def });
});
