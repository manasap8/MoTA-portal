import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../database/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { ApplicationDocument } from '../types';
import { ocrProvider } from '../ai/ocrProvider';
import { ConsistencyEngine } from '../ai/consistencyEngine';

export const documentsRouter = Router();

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedMime = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files under 5MB are permitted.'));
    }
  },
});

// Upload document
documentsRouter.post('/upload', authenticate, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const file = req.file;
    const { applicationId, schemeDocId, docType, title } = req.body;

    if (!applicationId || !docType) {
      return res.status(400).json({ error: { code: 'MISSING_DATA', message: 'Application ID and document type are required.' } });
    }

    const app = db.findApplicationById(applicationId);
    if (!app) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
    }

    if (!file) {
      return res.status(400).json({ error: { code: 'FILE_REQUIRED', message: 'No document file uploaded.' } });
    }

    // Check existing document of this type for this application
    const existing = db.getDocumentsByApplicationId(applicationId).find((d) => d.docType === docType);
    const newVersion = existing ? existing.version + 1 : 1;

    const docId = existing ? existing.id : `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newDoc: ApplicationDocument = {
      id: docId,
      applicationId: app.id,
      schemeDocId: schemeDocId || docType,
      docType,
      title: title || existing?.title || docType,
      fileName: file.filename,
      originalFileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileStatus: 'Processing',
      verificationStatus: 'Pending',
      version: newVersion,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveDocument(newDoc);

    // Run OCR asynchronously
    const extractedData = await ocrProvider.extract(file.path, file.originalname, docType, app.data);
    newDoc.extractedData = extractedData;
    newDoc.fileStatus = 'Processed';
    db.saveDocument(newDoc);

    // If an open deficiency exists for this docType or document, mark deficiency as Resubmitted
    const deficiencies = db.getDeficienciesByApplicationId(app.id).filter(
      (d) => (d.documentId === newDoc.id || d.linkedField === docType) && (d.status === 'Open' || d.status === 'Rejected')
    );

    for (const d of deficiencies) {
      d.status = 'Resubmitted';
      d.resubmittedDocumentId = newDoc.id;
      d.history.push({
        id: `hist_${Date.now()}`,
        action: 'Document Resubmitted',
        actorName: user.fullName,
        actorRole: user.role,
        remarks: `Applicant uploaded version ${newDoc.version} of ${newDoc.title}.`,
        documentVersion: newDoc.version,
        createdAt: new Date().toISOString(),
      });
      db.saveDeficiency(d);
    }

    // Re-run consistency checks
    const allDocs = db.getDocumentsByApplicationId(app.id);
    const consistency = ConsistencyEngine.evaluate(app, allDocs);
    db.saveConsistency(app.id, consistency);
    app.consistencyScore = consistency.score;
    app.riskLevel = consistency.riskLevel;
    app.lastUpdatedAt = new Date().toISOString();
    db.saveApplication(app);

    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPLOAD_DOCUMENT',
      entityType: 'Document',
      entityId: newDoc.id,
      newValue: { fileName: file.originalname, docType, version: newDoc.version },
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.status(201).json({
      message: 'Document uploaded and analyzed successfully.',
      document: newDoc,
      consistency,
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'UPLOAD_FAILED', message: err.message || 'File upload failed.' } });
  }
});

// Attach Sample Document (one-click demo helper)
documentsRouter.post('/sample-attach', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { applicationId, schemeDocId, docType, sampleScenario } = req.body;

    const app = db.findApplicationById(applicationId);
    if (!app) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
    }

    // Determine filename based on docType and scenario
    let sampleFileName = 'sample_st_cert_matching.pdf';
    let title = 'Scheduled Tribe Certificate';

    if (docType === 'st_certificate') {
      title = 'Scheduled Tribe Certificate';
      if (sampleScenario === 'mismatch_name') sampleFileName = 'sample_st_cert_mismatch_name.pdf';
      else if (sampleScenario === 'mismatch_dob') sampleFileName = 'sample_st_cert_mismatch_dob.pdf';
      else sampleFileName = 'sample_st_cert_matching.pdf';
    } else if (docType === 'income_certificate') {
      title = 'Income Certificate';
      if (sampleScenario === 'expired') sampleFileName = 'sample_income_cert_expired.pdf';
      else sampleFileName = 'sample_income_cert_valid.pdf';
    } else if (docType === 'passport') {
      title = 'Valid Indian Passport';
      sampleFileName = 'sample_passport_valid.pdf';
    } else if (docType === 'admission_letter') {
      title = 'Admission / Enrolment Letter';
      sampleFileName = 'sample_admission_letter.pdf';
    } else if (docType === 'degree_certificate') {
      title = 'Postgraduate Marksheet / Degree';
      sampleFileName = 'sample_marksheet_pg.pdf';
    } else if (docType === 'research_proposal') {
      title = 'Research Proposal Synopsis';
      sampleFileName = 'sample_research_proposal.pdf';
    }

    const filePath = path.join(uploadDir, sampleFileName);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `DEMO SAMPLE FILE: ${title} (${sampleScenario || 'standard'})`, 'utf-8');
    }

    const existing = db.getDocumentsByApplicationId(app.id).find((d) => d.docType === docType);
    const newVersion = existing ? existing.version + 1 : 1;

    const docId = existing ? existing.id : `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newDoc: ApplicationDocument = {
      id: docId,
      applicationId: app.id,
      schemeDocId: schemeDocId || docType,
      docType,
      title,
      fileName: sampleFileName,
      originalFileName: sampleFileName,
      filePath,
      fileSize: 154200,
      mimeType: 'application/pdf',
      fileStatus: 'Processing',
      verificationStatus: 'Pending',
      version: newVersion,
      isSampleDoc: true,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveDocument(newDoc);

    const extractedData = await ocrProvider.extract(filePath, sampleFileName, docType, app.data);
    newDoc.extractedData = extractedData;
    newDoc.fileStatus = 'Processed';
    db.saveDocument(newDoc);

    // Update deficiencies if any
    const defs = db.getDeficienciesByApplicationId(app.id).filter(
      (d) => (d.documentId === newDoc.id || d.linkedField === docType) && (d.status === 'Open' || d.status === 'Rejected')
    );
    for (const d of defs) {
      d.status = 'Resubmitted';
      d.resubmittedDocumentId = newDoc.id;
      d.history.push({
        id: `hist_${Date.now()}`,
        action: 'Sample Document Attached & Resubmitted',
        actorName: user.fullName,
        actorRole: user.role,
        remarks: `Attached sample file (${sampleScenario || 'standard'}).`,
        documentVersion: newDoc.version,
        createdAt: new Date().toISOString(),
      });
      db.saveDeficiency(d);
    }

    // Re-evaluate consistency
    const allDocs = db.getDocumentsByApplicationId(app.id);
    const consistency = ConsistencyEngine.evaluate(app, allDocs);
    db.saveConsistency(app.id, consistency);
    app.consistencyScore = consistency.score;
    app.riskLevel = consistency.riskLevel;
    app.lastUpdatedAt = new Date().toISOString();
    db.saveApplication(app);

    return res.json({
      message: 'Sample document attached and processed.',
      document: newDoc,
      consistency,
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SAMPLE_ATTACH_ERROR', message: err.message } });
  }
});

// Officer: Verify document
documentsRouter.post('/:id/verify', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role === 'applicant') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only officers can verify documents.' } });
  }

  const doc = db.findDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Document not found.' } });
  }

  const prev = { ...doc };
  doc.verificationStatus = 'Verified';
  doc.verificationRemarks = req.body.remarks || 'Document verified authentic by verification officer.';
  doc.verifiedBy = user.fullName;
  doc.verifiedAt = new Date().toISOString();
  doc.updatedAt = new Date().toISOString();

  db.saveDocument(doc);

  // If a deficiency was linked to this document, mark it Resolved
  const app = db.findApplicationById(doc.applicationId);
  if (app) {
    const defs = db.getDeficienciesByApplicationId(app.id).filter(
      (d) => (d.documentId === doc.id || d.linkedField === doc.docType) && d.status !== 'Resolved'
    );
    for (const d of defs) {
      d.status = 'Resolved';
      d.resolvedAt = new Date().toISOString();
      d.resolutionRemarks = 'Resolved upon document verification.';
      d.history.push({
        id: `hist_${Date.now()}`,
        action: 'Deficiency Resolved',
        actorName: user.fullName,
        actorRole: user.role,
        remarks: 'Document verified satisfactory.',
        createdAt: new Date().toISOString(),
      });
      db.saveDeficiency(d);
    }
  }

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'VERIFY_DOCUMENT',
    entityType: 'Document',
    entityId: doc.id,
    previousValue: { verificationStatus: prev.verificationStatus },
    newValue: { verificationStatus: 'Verified', remarks: doc.verificationRemarks },
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Document marked as Verified.', document: doc });
});

// Officer: Reject document
documentsRouter.post('/:id/reject', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role === 'applicant') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only officers can reject documents.' } });
  }

  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: { code: 'REASON_REQUIRED', message: 'Rejection reason is required.' } });
  }

  const doc = db.findDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Document not found.' } });
  }

  const prev = { ...doc };
  doc.verificationStatus = 'Rejected';
  doc.verificationRemarks = reason;
  doc.verifiedBy = user.fullName;
  doc.verifiedAt = new Date().toISOString();
  doc.updatedAt = new Date().toISOString();

  db.saveDocument(doc);

  // Automatically raise a deficiency for this rejection
  const app = db.findApplicationById(doc.applicationId);
  if (app) {
    app.status = 'Deficient';
    db.saveApplication(app);

    const defId = `def_${Date.now()}_${doc.id}`;
    db.saveDeficiency({
      id: defId,
      applicationId: app.id,
      documentId: doc.id,
      category: 'Document Mismatch',
      title: `Rejected Document: ${doc.title}`,
      description: reason,
      linkedField: doc.docType,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Open',
      raisedBy: user.fullName,
      raisedAt: new Date().toISOString(),
      history: [
        {
          id: `hist_${Date.now()}`,
          action: 'Document Rejected & Deficiency Raised',
          actorName: user.fullName,
          actorRole: user.role,
          remarks: reason,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const applicantUser = db.findUserByEmail(app.applicantEmail);
    if (applicantUser) {
      db.addNotification({
        id: `notif_${Date.now()}`,
        userId: applicantUser.id,
        title: `Document Rejected: ${doc.title}`,
        message: `Your uploaded document ${doc.title} was rejected by verification officer. Reason: ${reason}. Please resubmit.`,
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
    action: 'REJECT_DOCUMENT',
    entityType: 'Document',
    entityId: doc.id,
    previousValue: { verificationStatus: prev.verificationStatus },
    newValue: { verificationStatus: 'Rejected', remarks: reason },
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Document marked as Rejected and deficiency raised.', document: doc });
});

// Officer: Request clarification
documentsRouter.post('/:id/clarify', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role === 'applicant') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only officers can request clarification.' } });
  }

  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: { code: 'REASON_REQUIRED', message: 'Clarification details are required.' } });
  }

  const doc = db.findDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Document not found.' } });
  }

  doc.verificationStatus = 'Needs Clarification';
  doc.verificationRemarks = reason;
  doc.verifiedBy = user.fullName;
  doc.verifiedAt = new Date().toISOString();
  doc.updatedAt = new Date().toISOString();

  db.saveDocument(doc);

  const app = db.findApplicationById(doc.applicationId);
  if (app) {
    const applicantUser = db.findUserByEmail(app.applicantEmail);
    if (applicantUser) {
      db.addNotification({
        id: `notif_${Date.now()}`,
        userId: applicantUser.id,
        title: `Clarification Requested: ${doc.title}`,
        message: `Officer requested clarification regarding ${doc.title}: ${reason}`,
        type: 'warning',
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
    action: 'REQUEST_DOCUMENT_CLARIFICATION',
    entityType: 'Document',
    entityId: doc.id,
    newValue: { verificationStatus: 'Needs Clarification', remarks: reason },
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Clarification requested.', document: doc });
});

// Officer: Edit extracted values (with audit log)
documentsRouter.put('/:id/extraction', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role === 'applicant') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Applicants cannot edit OCR extractions.' } });
  }

  const doc = db.findDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Document not found.' } });
  }

  const prev = doc.extractedData;
  doc.extractedData = {
    ...(doc.extractedData || { provider: 'demo', extractedAt: new Date().toISOString() }),
    ...req.body,
  };
  doc.updatedAt = new Date().toISOString();

  db.saveDocument(doc);

  // Re-run consistency checks
  const app = db.findApplicationById(doc.applicationId);
  if (app) {
    const allDocs = db.getDocumentsByApplicationId(app.id);
    const consistency = ConsistencyEngine.evaluate(app, allDocs);
    db.saveConsistency(app.id, consistency);
    app.consistencyScore = consistency.score;
    app.riskLevel = consistency.riskLevel;
    db.saveApplication(app);
  }

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'OVERRIDE_OCR_EXTRACTION',
    entityType: 'Document',
    entityId: doc.id,
    previousValue: prev,
    newValue: doc.extractedData,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'Extracted values updated successfully.', document: doc });
});

// Download / stream document
documentsRouter.get('/:id/file', authenticate, (req: AuthenticatedRequest, res) => {
  const doc = db.findDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).send('Document not found');
  }

  if (fs.existsSync(doc.filePath)) {
    return res.sendFile(path.resolve(doc.filePath));
  } else {
    // Generate fallback plain text preview
    res.setHeader('Content-Type', 'text/plain');
    return res.send(`PROTOTYPE DOCUMENT PREVIEW:\n\nDocument Title: ${doc.title}\nOriginal File: ${doc.originalFileName}\nStatus: ${doc.verificationStatus}\nExtracted Fields: ${JSON.stringify(doc.extractedData, null, 2)}`);
  }
});
