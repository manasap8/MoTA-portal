import { Router } from 'express';
import { db } from '../database/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { PostSelectionRecord, ProgressRecord } from '../types';

export const postSelectionRouter = Router();

// Get post selection details for current user or application
postSelectionRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { applicationId } = req.query;

  let targetAppId = applicationId ? String(applicationId) : undefined;

  if (!targetAppId && user.role === 'applicant') {
    const profile = db.findApplicantByUserId(user.id);
    // Find an application in 'Selected' or 'Post-Selection'
    const selectedApp = db
      .getApplications()
      .find((a) => (a.applicantId === profile?.id || a.applicantEmail === user.email) && (a.status === 'Selected' || a.currentStage === 'POST_SELECTION'));
    targetAppId = selectedApp?.id;
  }

  if (!targetAppId) {
    // If officer, return all post selection records
    if (user.role !== 'applicant') {
      const allRecords = db.getPostSelectionRecords();
      return res.json(allRecords);
    }
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No active post-selection record found.' } });
  }

  const record = db.findPostSelectionByApplicationId(targetAppId);
  const progressRecords = db.getProgressRecordsByApplicationId(targetAppId);
  const app = db.findApplicationById(targetAppId);

  return res.json({
    record,
    progressRecords,
    application: app,
    disclaimer: 'Disbursement: Direct Benefit Transfer (DBT) execution via PFMS is outside the administrative scope of this prototype.',
  });
});

// Applicant: Submit post-selection document
postSelectionRouter.post('/submit-doc', authenticate, (req: AuthenticatedRequest, res) => {
  const { applicationId, docCode, title } = req.body;
  if (!applicationId || !docCode) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Application ID and docCode are required.' } });
  }

  let postSel = db.findPostSelectionByApplicationId(applicationId);
  if (!postSel) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post-selection record not found.' } });
  }

  const docItem = postSel.requiredDocuments.find((d) => d.code === docCode);
  if (docItem) {
    docItem.submitted = true;
    docItem.remarks = 'Uploaded by fellow, awaiting verification.';
  } else {
    postSel.requiredDocuments.push({
      code: docCode,
      title: title || docCode,
      submitted: true,
      verified: false,
      remarks: 'Uploaded by fellow.',
    });
  }

  postSel.updatedAt = new Date().toISOString();
  db.savePostSelectionRecord(postSel);

  return res.json({ message: 'Document submitted for post-selection verification.', record: postSel });
});

// Officer: Verify post-selection document
postSelectionRouter.post('/verify-doc', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role === 'applicant') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only officers can verify post-selection documents.' } });
  }

  const { applicationId, docCode, verified = true, remarks } = req.body;
  const postSel = db.findPostSelectionByApplicationId(applicationId);
  if (!postSel) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post-selection record not found.' } });
  }

  const docItem = postSel.requiredDocuments.find((d) => d.code === docCode);
  if (docItem) {
    docItem.verified = verified;
    docItem.remarks = remarks || (verified ? 'Verified authentic.' : 'Verification rejected.');
  }

  // If all docs are verified, activate fellow status
  const allVerified = postSel.requiredDocuments.every((d) => d.verified);
  if (allVerified) {
    postSel.joiningStatus = 'Active Fellow';
  }

  postSel.updatedAt = new Date().toISOString();
  db.savePostSelectionRecord(postSel);

  return res.json({ message: 'Post-selection document verification saved.', record: postSel });
});

// Applicant: Submit progress record (NFST)
postSelectionRouter.post('/progress', authenticate, (req: AuthenticatedRequest, res) => {
  const { applicationId, semesterOrYear, progressTitle, researchSummary, supervisorRemarks } = req.body;
  if (!applicationId || !semesterOrYear || !researchSummary) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing progress submission fields.' } });
  }

  const newProg: ProgressRecord = {
    id: `prog_${Date.now()}`,
    applicationId,
    semesterOrYear,
    progressTitle: progressTitle || 'Semester Progress Report',
    researchSummary,
    supervisorRemarks: supervisorRemarks || 'Research work recommended for continuation.',
    officerApprovalStatus: 'Pending',
    submittedAt: new Date().toISOString(),
  };

  db.saveProgressRecord(newProg);

  return res.status(201).json({ message: 'Progress report submitted for officer review.', progressRecord: newProg });
});

// Officer: Approve or Reject progress record
postSelectionRouter.post('/progress/:id/approval', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role === 'applicant') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only officers can approve progress records.' } });
  }

  const { status, remarks } = req.body;
  const allProg = db.getData().progressRecords;
  const record = allProg.find((p) => p.id === req.params.id);

  if (!record) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Progress record not found.' } });
  }

  record.officerApprovalStatus = status || 'Approved';
  record.officerRemarks = remarks || 'Approved for fellowship continuation.';
  record.approvedAt = new Date().toISOString();

  db.saveProgressRecord(record);

  return res.json({ message: `Progress record ${record.officerApprovalStatus}.`, progressRecord: record });
});
