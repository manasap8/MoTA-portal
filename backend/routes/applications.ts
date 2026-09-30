import { Router } from 'express';
import { db } from '../database/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { Application, ApplicationStatus } from '../types';
import { ConsistencyEngine } from '../ai/consistencyEngine';
import { EligibilityEngine } from '../ai/eligibilityEngine';

export const applicationsRouter = Router();

// List applications with filters
applicationsRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let apps = db.getApplications();

  // Role isolation: Applicants only see their own applications
  if (user.role === 'applicant') {
    const profile = db.findApplicantByUserId(user.id);
    apps = apps.filter((a) => a.applicantId === profile?.id || a.applicantEmail.toLowerCase() === user.email.toLowerCase());
  }

  // Filters
  const { scheme, status, risk, eligibility, state, search } = req.query;

  if (scheme) {
    apps = apps.filter((a) => a.schemeId === scheme || a.schemeId.toLowerCase().includes(String(scheme).toLowerCase()));
  }
  if (status) {
    apps = apps.filter((a) => a.status.toLowerCase() === String(status).toLowerCase());
  }
  if (risk) {
    apps = apps.filter((a) => a.riskLevel === String(risk));
  }
  if (eligibility) {
    apps = apps.filter((a) => a.eligibilityStatus === String(eligibility));
  }
  if (state) {
    apps = apps.filter((a) => a.data?.state?.toLowerCase() === String(state).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    apps = apps.filter(
      (a) =>
        a.applicationNumber.toLowerCase().includes(q) ||
        a.applicantName.toLowerCase().includes(q) ||
        a.applicantEmail.toLowerCase().includes(q) ||
        a.schemeId.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
    );
  }

  // Return sorted by updated / created desc
  apps.sort((a, b) => new Date(b.lastUpdatedAt || b.createdAt).getTime() - new Date(a.lastUpdatedAt || a.createdAt).getTime());

  res.json(apps);
});

// Get single application with all associated intelligence
applicationsRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const app = db.findApplicationById(req.params.id);

  if (!app) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }

  // Role guard: Applicant cannot view other applicant's application
  if (user.role === 'applicant') {
    const profile = db.findApplicantByUserId(user.id);
    if (app.applicantId !== profile?.id && app.applicantEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied to this application.' } });
    }
  }

  const documents = db.getDocumentsByApplicationId(app.id);
  const deficiencies = db.getDeficienciesByApplicationId(app.id);
  const consistency = db.getConsistency(app.id);
  const eligibility = db.getEligibility(app.id);
  const selection = db.findSelectionByApplicationId(app.id);
  const postSelection = db.findPostSelectionByApplicationId(app.id);
  const progressRecords = db.getProgressRecordsByApplicationId(app.id);
  const communications = db.getCommunicationsByApplicationId(app.id);
  const scheme = db.findSchemeById(app.schemeId);

  res.json({
    application: app,
    scheme,
    documents,
    deficiencies,
    consistency,
    eligibility,
    selection,
    postSelection,
    progressRecords,
    communications,
  });
});

// Create new application (Draft)
applicationsRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'applicant') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only applicants can create applications.' } });
  }

  const { schemeId, initialData } = req.body;
  const scheme = db.findSchemeById(schemeId);
  if (!scheme) {
    return res.status(400).json({ error: { code: 'INVALID_SCHEME', message: 'Selected scheme does not exist.' } });
  }

  const profile = db.findApplicantByUserId(user.id);
  const applicantId = profile?.id || `app_prof_${user.id}`;

  const count = db.getApplications().length + 1;
  const year = new Date().getFullYear();
  const appNumber = `${scheme.code}-${year}-${String(count).padStart(3, '0')}`;

  const newApp: Application = {
    id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    applicationNumber: appNumber,
    schemeId: scheme.id,
    applicantId,
    applicantName: user.fullName,
    applicantEmail: user.email,
    status: 'Draft',
    currentStage: 'SUBMITTED',
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    data: {
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      category: 'ST',
      ...(profile || {}),
      ...(initialData || {}),
    },
  };

  db.saveApplication(newApp);

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'CREATE_DRAFT_APPLICATION',
    entityType: 'Application',
    entityId: newApp.id,
    newValue: { applicationNumber: newApp.applicationNumber, scheme: scheme.code },
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.status(201).json({
    message: 'Application draft created successfully.',
    application: newApp,
  });
});

// Update draft data
applicationsRouter.put('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const app = db.findApplicationById(req.params.id);
  if (!app) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }

  // Authorization check
  if (user.role === 'applicant') {
    const profile = db.findApplicantByUserId(user.id);
    if (app.applicantId !== profile?.id && app.applicantEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied.' } });
    }
    if (app.status !== 'Draft' && app.status !== 'Deficient') {
      return res.status(400).json({
        error: { code: 'IMMUTABLE_APPLICATION', message: 'Submitted applications cannot be modified unless deficiency is raised.' },
      });
    }
  }

  const prev = { ...app };
  app.data = {
    ...(app.data || {}),
    ...(req.body.data || {}),
  };
  app.lastUpdatedAt = new Date().toISOString();

  // If application is deficient and applicant updated linked fields, check for deficiency auto-update
  if (app.status === 'Deficient' && user.role === 'applicant') {
    const defs = db.getDeficienciesByApplicationId(app.id).filter((d) => d.status === 'Open');
    for (const d of defs) {
      if (d.linkedField && req.body.data && req.body.data[d.linkedField] !== undefined) {
        d.status = 'Resubmitted';
        d.history.push({
          id: `hist_${Date.now()}`,
          action: 'Field Corrected & Resubmitted',
          actorName: user.fullName,
          actorRole: user.role,
          remarks: `Applicant updated field "${d.linkedField}".`,
          createdAt: new Date().toISOString(),
        });
        db.saveDeficiency(d);
      }
    }
  }

  db.saveApplication(app);

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'UPDATE_APPLICATION_DRAFT',
    entityType: 'Application',
    entityId: app.id,
    previousValue: prev.data,
    newValue: app.data,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Application saved successfully.', application: app });
});

// Submit Application
applicationsRouter.post('/:id/submit', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const app = db.findApplicationById(req.params.id);
  if (!app) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }

  // Ownership check
  if (user.role === 'applicant') {
    const profile = db.findApplicantByUserId(user.id);
    if (app.applicantId !== profile?.id && app.applicantEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied.' } });
    }
  }

  const scheme = db.findSchemeById(app.schemeId);
  if (!scheme) {
    return res.status(400).json({ error: { code: 'INVALID_SCHEME', message: 'Scheme not found.' } });
  }

  // Pre-submission validation
  const appData = app.data || {};
  if (!appData.agreedTerms) {
    return res.status(400).json({
      error: { code: 'DECLARATION_REQUIRED', message: 'You must accept the statutory declaration before submitting.' },
    });
  }

  const documents = db.getDocumentsByApplicationId(app.id);

  // 1. Run Consistency Engine
  const consistency = ConsistencyEngine.evaluate(app, documents);
  db.saveConsistency(app.id, consistency);

  // 2. Run Deterministic Rule Engine
  const eligibility = EligibilityEngine.evaluate(app, documents, scheme.eligibilityRules);
  db.saveEligibility(app.id, eligibility);

  // 3. Auto-detect missing mandatory documents -> create deficiency automatically if missing
  const uploadedDocCodes = new Set(documents.map((d) => d.docType));
  const missingMandatoryDocs = scheme.requiredDocuments.filter((r) => r.mandatory && !uploadedDocCodes.has(r.code));

  let finalStatus: ApplicationStatus = 'Submitted';
  if (missingMandatoryDocs.length > 0) {
    finalStatus = 'Deficient';
    for (const m of missingMandatoryDocs) {
      const defId = `def_${Date.now()}_${m.code}`;
      const def: any = {
        id: defId,
        applicationId: app.id,
        category: 'Missing Document',
        title: `Mandatory Document Missing: ${m.title}`,
        description: `Your application lacks the mandatory upload for ${m.title} (${m.description}). Please upload it promptly to proceed.`,
        linkedField: m.code,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Open',
        raisedBy: 'Automated Deficiency System',
        raisedAt: new Date().toISOString(),
        history: [
          {
            id: `hist_${Date.now()}`,
            action: 'Automated Deficiency Created',
            actorName: 'Rule Engine',
            actorRole: 'System',
            remarks: `Missing mandatory file ${m.title} upon initial submission.`,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      db.saveDeficiency(def);
    }
  }

  app.status = finalStatus;
  app.currentStage = finalStatus === 'Deficient' ? 'DOC_VERIF' : 'DOC_VERIF';
  app.submittedAt = new Date().toISOString();
  app.lastUpdatedAt = new Date().toISOString();
  app.consistencyScore = consistency.score;
  app.riskLevel = consistency.riskLevel;
  app.eligibilityStatus = eligibility.overallStatus;

  db.saveApplication(app);

  // Create notifications
  db.addNotification({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: `Application ${app.applicationNumber} Submitted`,
    message:
      finalStatus === 'Deficient'
        ? `Your application ${app.applicationNumber} was received with missing documents. Please view the Deficiencies tab.`
        : `Your application ${app.applicationNumber} has been successfully submitted and forwarded for Document Verification.`,
    type: finalStatus === 'Deficient' ? 'warning' : 'success',
    relatedApplicationId: app.id,
    linkUrl: `/applicant/applications/${app.id}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'SUBMIT_APPLICATION',
    entityType: 'Application',
    entityId: app.id,
    newValue: { status: app.status, consistencyScore: consistency.score, eligibilityStatus: eligibility.overallStatus },
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({
    message: 'Application submitted successfully.',
    application: app,
    consistency,
    eligibility,
  });
});

// Officer / Admin: Transition application stage (with deficiency guard!)
applicationsRouter.post('/:id/transition', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role === 'applicant') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only officers can transition stages.' } });
  }

  const app = db.findApplicationById(req.params.id);
  if (!app) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }

  const { targetStage, targetStatus, remarks } = req.body;

  // BLOCK IF OPEN DEFICIENCIES EXIST!
  const openDeficiencies = db.getDeficienciesByApplicationId(app.id).filter((d) => d.status === 'Open' || d.status === 'Resubmitted');
  if (openDeficiencies.length > 0 && targetStage !== 'DOC_VERIF') {
    return res.status(400).json({
      error: {
        code: 'OPEN_DEFICIENCIES_BLOCKED',
        message: `Cannot advance application to "${targetStage}". There are ${openDeficiencies.length} open deficiency items awaiting resolution.`,
      },
    });
  }

  const prevStage = app.currentStage;
  const prevStatus = app.status;

  if (targetStage) app.currentStage = targetStage;
  if (targetStatus) app.status = targetStatus;
  app.lastUpdatedAt = new Date().toISOString();

  db.saveApplication(app);

  // Notify applicant
  const applicantUser = db.findUserByEmail(app.applicantEmail);
  if (applicantUser) {
    db.addNotification({
      id: `notif_${Date.now()}`,
      userId: applicantUser.id,
      title: `Application Stage Updated: ${app.applicationNumber}`,
      message: `Your application has progressed to stage: ${targetStage || app.currentStage}. Remarks: ${remarks || 'Stage approved.'}`,
      type: 'info',
      relatedApplicationId: app.id,
      linkUrl: `/applicant/applications/${app.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'TRANSITION_STAGE',
    entityType: 'Application',
    entityId: app.id,
    previousValue: { stage: prevStage, status: prevStatus },
    newValue: { stage: app.currentStage, status: app.status, remarks },
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({
    message: `Application transitioned to ${app.currentStage} (${app.status}).`,
    application: app,
  });
});
