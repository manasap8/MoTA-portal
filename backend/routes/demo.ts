import { Router } from 'express';
import { runDatabaseSeed } from '../database/seed';
import { db } from '../database/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

export const demoRouter = Router();

// Reset demo data back to default pristine scenario state
demoRouter.post('/reset', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    await runDatabaseSeed(true);
    db.addAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email || 'admin@demo.com',
      userRole: req.user?.role || 'admin',
      action: 'DEMO_DATA_RESET',
      entityType: 'System',
      entityId: 'ALL',
      newValue: { message: 'Database reset to default demo scenario state.' },
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      message: 'Demo database has been successfully reset to default scenario state with 11 demo applications.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'RESET_FAILED', message: err.message } });
  }
});

// Available sample documents library for judges/evaluators
demoRouter.get('/sample-documents', (req, res) => {
  const library = [
    {
      docType: 'st_certificate',
      title: 'Scheduled Tribe Certificate',
      scenarios: [
        { code: 'matching', label: 'Matching Certificate (Consistent name & details)', sampleFile: 'sample_st_cert_matching.pdf' },
        { code: 'mismatch_name', label: 'Name Formatting Variation ("Rahul K." instead of "Rahul Kumar")', sampleFile: 'sample_st_cert_mismatch_name.pdf' },
        { code: 'mismatch_dob', label: 'Date of Birth Mismatch (1998-05-21 vs 1998-05-12)', sampleFile: 'sample_st_cert_mismatch_dob.pdf' },
      ],
    },
    {
      docType: 'income_certificate',
      title: 'Annual Family Income Certificate',
      scenarios: [
        { code: 'valid', label: 'Valid Income Certificate (FY 2024-25, within ceiling)', sampleFile: 'sample_income_cert_valid.pdf' },
        { code: 'expired', label: 'Expired Income Certificate (Expired on 2023-03-31)', sampleFile: 'sample_income_cert_expired.pdf' },
      ],
    },
    {
      docType: 'passport',
      title: 'Valid Indian Passport (NOS)',
      scenarios: [
        { code: 'valid', label: 'Valid Passport (Z4829104, Expiry 2031)', sampleFile: 'sample_passport_valid.pdf' },
      ],
    },
    {
      docType: 'admission_letter',
      title: 'Admission / Enrolment Letter',
      scenarios: [
        { code: 'valid', label: 'Confirmed Ph.D. Enrolment Letter (Delhi University)', sampleFile: 'sample_admission_letter.pdf' },
      ],
    },
    {
      docType: 'degree_certificate',
      title: 'Postgraduate Marksheet / Degree Certificate',
      scenarios: [
        { code: 'valid', label: 'Qualifying Postgraduate Marksheet (74.5% First Class)', sampleFile: 'sample_marksheet_pg.pdf' },
      ],
    },
    {
      docType: 'research_proposal',
      title: 'Research Proposal Synopsis',
      scenarios: [
        { code: 'valid', label: 'Research Synopsis (Ethnobotanical Traditions of Santhal Community)', sampleFile: 'sample_research_proposal.pdf' },
      ],
    },
  ];

  res.json(library);
});
