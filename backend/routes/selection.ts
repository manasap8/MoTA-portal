import { Router } from 'express';
import { db } from '../database/store';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { SelectionRecord, PostSelectionRecord } from '../types';

export const selectionRouter = Router();

// Record officer selection decision
selectionRouter.post('/decision', authenticate, requireRole(['selection', 'admin', 'officer']), (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { applicationId, decision, remarks, screeningScore, scoreBreakdown, aiRecommendation, aiRecommendationReason } = req.body;

  if (!applicationId || !decision) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Application ID and decision are required.' } });
  }

  if (decision === 'Reject' && (!remarks || !remarks.trim())) {
    return res.status(400).json({ error: { code: 'REASON_REQUIRED', message: 'Rejection decision requires an official recorded reason.' } });
  }

  const app = db.findApplicationById(applicationId);
  if (!app) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }

  let selection = db.findSelectionByApplicationId(app.id);
  const now = new Date().toISOString();

  if (!selection) {
    selection = {
      id: `sel_${Date.now()}_${app.id}`,
      applicationId: app.id,
      schemeId: app.schemeId,
      applicantId: app.applicantId,
      applicantName: app.applicantName,
      screeningScore: screeningScore || app.screeningScore || 80,
      scoreBreakdown: scoreBreakdown || {},
      aiRecommendation: aiRecommendation || 'Recommend shortlist',
      aiRecommendationReason: aiRecommendationReason || 'Based on merit criteria evaluation.',
      officerDecision: decision,
      officerRemarks: remarks,
      finalizedBy: user.fullName,
      finalizedAt: now,
      createdAt: now,
    };
  } else {
    selection.officerDecision = decision;
    selection.officerRemarks = remarks;
    selection.finalizedBy = user.fullName;
    selection.finalizedAt = now;
  }

  db.saveSelectionRecord(selection);

  // Update application
  app.officerDecision = decision;
  app.officerRemarks = remarks;
  app.lastUpdatedAt = now;

  if (decision === 'Shortlist') {
    app.status = 'Shortlisted';
    app.currentStage = 'SCREENING';
  } else if (decision === 'Select') {
    app.status = 'Selected';
    app.currentStage = 'POST_SELECTION';
    app.finalizedAt = now;
    app.postSelectionStatus = 'Pending Submission';

    // Seed post selection record if not existing
    let postSel = db.findPostSelectionByApplicationId(app.id);
    if (!postSel) {
      postSel = {
        id: `post_sel_${app.id}`,
        applicationId: app.id,
        schemeId: app.schemeId,
        applicantId: app.applicantId,
        applicantName: app.applicantName,
        awardAmount:
          app.schemeId === 'scheme_nos'
            ? '100% Tuition Fees + Living Allowance (£9,900 / $15,400 per annum)'
            : '₹31,000 / month + HRA & Annual Contingency ₹20,000',
        durationYears: app.schemeId === 'scheme_nos' ? 2 : 5,
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        joiningStatus: 'Pending Submission',
        requiredDocuments: [
          { code: 'joining_report', title: 'Department Joining Report signed by Head of Institution', submitted: false, verified: false },
          { code: 'undertaking_bond', title: 'Fellowship Undertaking Bond on Stamp Paper', submitted: false, verified: false },
          { code: 'mandate_form', title: 'PFMS Bank Mandate Form with Branch Seal', submitted: false, verified: false },
        ],
        updatedAt: now,
      };
      db.savePostSelectionRecord(postSel);
    }
  } else if (decision === 'Reject') {
    app.status = 'Not Selected';
  }

  db.saveApplication(app);

  // Notify applicant
  const applicantUser = db.findUserByEmail(app.applicantEmail);
  if (applicantUser) {
    db.addNotification({
      id: `notif_${Date.now()}`,
      userId: applicantUser.id,
      title: `Selection Decision: ${app.applicationNumber}`,
      message:
        decision === 'Select'
          ? `Congratulations! You have been provisionally selected for the ${app.schemeId.toUpperCase()} fellowship. Please check Post-Selection.`
          : decision === 'Shortlist'
          ? `Your application ${app.applicationNumber} has been shortlisted by the Selection Committee.`
          : `Official decision recorded for ${app.applicationNumber}: ${decision}. Remarks: ${remarks || ''}`,
      type: decision === 'Select' ? 'success' : decision === 'Reject' ? 'danger' : 'info',
      relatedApplicationId: app.id,
      linkUrl: decision === 'Select' ? '/applicant/post-selection' : `/applicant/applications/${app.id}`,
      isRead: false,
      createdAt: now,
    });
  }

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'OFFICER_SELECTION_DECISION',
    entityType: 'SelectionRecord',
    entityId: selection.id,
    newValue: { decision, remarks, applicant: app.applicantName },
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({
    message: `Selection decision "${decision}" recorded successfully.`,
    selection,
    application: app,
  });
});

// Export Selection List CSV
selectionRouter.get('/export-csv', authenticate, (req, res) => {
  const { schemeId } = req.query;
  let apps = db.getApplications().filter((a) => a.status === 'Selected' || a.officerDecision === 'Select' || a.status === 'Shortlisted');

  if (schemeId) {
    apps = apps.filter((a) => a.schemeId === schemeId);
  }

  const csvRows = [
    ['Application Number', 'Applicant Name', 'Scheme', 'State', 'Category', 'Academic Marks %', 'Screening Score', 'Status', 'Decision', 'Officer Remarks', 'Finalized Date'],
  ];

  for (const a of apps) {
    const sel = db.findSelectionByApplicationId(a.id);
    csvRows.push([
      `"${a.applicationNumber}"`,
      `"${a.applicantName}"`,
      `"${a.schemeId.toUpperCase()}"`,
      `"${a.data?.state || ''}"`,
      `"ST"`,
      `"${a.data?.postgraduatePercentage || a.data?.marksPercentage || ''}"`,
      `"${sel?.screeningScore ?? a.screeningScore ?? ''}"`,
      `"${a.status}"`,
      `"${a.officerDecision || 'Selected'}"`,
      `"${(a.officerRemarks || '').replace(/"/g, '""')}"`,
      `"${a.finalizedAt || ''}"`,
    ]);
  }

  const csvString = csvRows.map((r) => r.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="selection_list_${Date.now()}.csv"`);
  return res.send(csvString);
});
