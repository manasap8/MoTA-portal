import { Router } from 'express';
import { db } from '../database/store';
import { authenticate, requireRole } from '../middleware/auth';

export const reportsRouter = Router();

// Generate live report data
reportsRouter.get('/:type', authenticate, requireRole(['officer', 'selection', 'admin']), (req, res) => {
  const { type } = req.params;
  const { scheme, state } = req.query;

  let apps = db.getApplications();
  if (scheme) apps = apps.filter((a) => a.schemeId === scheme);
  if (state) apps = apps.filter((a) => a.data?.state === state);

  if (type === 'applications-summary') {
    const data = apps.map((a) => ({
      applicationNumber: a.applicationNumber,
      applicantName: a.applicantName,
      scheme: a.schemeId.toUpperCase(),
      state: a.data?.state || 'Jharkhand',
      submissionDate: a.submittedAt || a.createdAt,
      status: a.status,
      stage: a.currentStage,
      consistencyScore: a.consistencyScore || 80,
      riskLevel: a.riskLevel || 'LOW',
    }));
    return res.json({ title: 'Application Summary Report', totalRecords: data.length, records: data });
  }

  if (type === 'eligibility-report') {
    const data = apps.map((a) => {
      const elig = db.getEligibility(a.id);
      return {
        applicationNumber: a.applicationNumber,
        applicantName: a.applicantName,
        scheme: a.schemeId.toUpperCase(),
        overallEligibility: a.eligibilityStatus || 'Requires review',
        criteriaSatisfied: elig ? elig.criteriaResults.filter((c) => c.status === 'PASS').length : 0,
        totalCriteria: elig ? elig.criteriaResults.length : 0,
        evaluatedAt: elig?.evaluatedAt || a.lastUpdatedAt,
      };
    });
    return res.json({ title: 'Statutory Eligibility Verification Report', totalRecords: data.length, records: data });
  }

  if (type === 'document-verification') {
    const allDocs = db.getData().documents;
    const data = allDocs.map((d) => {
      const app = db.findApplicationById(d.applicationId);
      return {
        applicationNumber: app?.applicationNumber || 'N/A',
        applicantName: app?.applicantName || 'N/A',
        documentTitle: d.title,
        docType: d.docType,
        verificationStatus: d.verificationStatus,
        verifiedBy: d.verifiedBy || 'Pending',
        verifiedAt: d.verifiedAt || 'Pending',
        extractedName: d.extractedData?.name || 'N/A',
        certificateNumber: d.extractedData?.certificateNumber || 'N/A',
      };
    });
    return res.json({ title: 'Document Scrutiny and Verification Report', totalRecords: data.length, records: data });
  }

  if (type === 'deficiencies') {
    const defs = db.getAllDeficiencies();
    const data = defs.map((d) => {
      const app = db.findApplicationById(d.applicationId);
      return {
        applicationNumber: app?.applicationNumber || 'N/A',
        applicantName: app?.applicantName || 'N/A',
        deficiencyTitle: d.title,
        category: d.category,
        status: d.status,
        dueDate: d.dueDate,
        raisedBy: d.raisedBy,
        raisedAt: d.raisedAt,
        resolvedAt: d.resolvedAt || 'N/A',
      };
    });
    return res.json({ title: 'Deficiency Tracking and Resolution Report', totalRecords: data.length, records: data });
  }

  if (type === 'selection') {
    const sels = db.getSelectionRecords();
    const data = sels.map((s) => {
      const app = db.findApplicationById(s.applicationId);
      return {
        applicationNumber: app?.applicationNumber || s.applicationId,
        applicantName: s.applicantName,
        scheme: s.schemeId.toUpperCase(),
        screeningScore: s.screeningScore,
        aiRecommendation: s.aiRecommendation,
        officerDecision: s.officerDecision,
        finalizedBy: s.finalizedBy || 'Pending',
        finalizedAt: s.finalizedAt || 'Pending',
      };
    });
    return res.json({ title: 'Merit Selection & Award List Report', totalRecords: data.length, records: data });
  }

  return res.status(400).json({ error: { code: 'INVALID_REPORT_TYPE', message: 'Unknown report type' } });
});

// CSV Export for Reports
reportsRouter.get('/:type/csv', authenticate, requireRole(['officer', 'selection', 'admin']), (req, res) => {
  const { type } = req.params;
  const apps = db.getApplications();

  let csvContent = '';
  if (type === 'applications-summary') {
    csvContent = 'Application Number,Applicant Name,Scheme,State,Status,Stage,Consistency Score,Risk Level\n' +
      apps.map((a) => `"${a.applicationNumber}","${a.applicantName}","${a.schemeId.toUpperCase()}","${a.data?.state || ''}","${a.status}","${a.currentStage}","${a.consistencyScore || 80}","${a.riskLevel || 'LOW'}"`).join('\n');
  } else if (type === 'deficiencies') {
    const defs = db.getAllDeficiencies();
    csvContent = 'Deficiency Title,Application Number,Category,Status,Due Date,Raised By,Raised At,Resolved At\n' +
      defs.map((d) => `"${d.title}","${d.applicationId}","${d.category}","${d.status}","${d.dueDate}","${d.raisedBy}","${d.raisedAt}","${d.resolvedAt || ''}"`).join('\n');
  } else {
    csvContent = 'Application Number,Applicant Name,Scheme,Status,Screening Score,Officer Decision\n' +
      apps.map((a) => `"${a.applicationNumber}","${a.applicantName}","${a.schemeId.toUpperCase()}","${a.status}","${a.screeningScore || ''}","${a.officerDecision || ''}"`).join('\n');
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.csv"`);
  return res.send(csvContent);
});
