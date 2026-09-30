import { Router } from 'express';
import { db } from '../database/store';
import { authenticate, requireRole } from '../middleware/auth';

export const analyticsRouter = Router();

analyticsRouter.get('/dashboard', authenticate, requireRole(['officer', 'selection', 'admin']), (req, res) => {
  const { scheme, state } = req.query;
  let apps = db.getApplications();

  if (scheme) {
    apps = apps.filter((a) => a.schemeId === scheme);
  }
  if (state) {
    apps = apps.filter((a) => a.data?.state === state);
  }

  const total = apps.length;
  const pending = apps.filter((a) => a.status === 'Submitted' || a.status === 'Under Verification').length;
  const deficient = apps.filter((a) => a.status === 'Deficient').length;
  const eligible = apps.filter((a) => a.status === 'Eligible').length;
  const ineligible = apps.filter((a) => a.status === 'Ineligible' || a.eligibilityStatus === 'Ineligible').length;
  const shortlisted = apps.filter((a) => a.status === 'Shortlisted').length;
  const selected = apps.filter((a) => a.status === 'Selected').length;
  const rejected = apps.filter((a) => a.status === 'Not Selected' || a.officerDecision === 'Reject').length;

  // By Scheme
  const byScheme = [
    { name: 'NFST (Fellowship)', count: apps.filter((a) => a.schemeId === 'scheme_nfst').length, code: 'NFST' },
    { name: 'NOS (Overseas)', count: apps.filter((a) => a.schemeId === 'scheme_nos').length, code: 'NOS' },
  ];

  // By State
  const stateCounts: Record<string, number> = {};
  for (const a of apps) {
    const st = a.data?.state || 'Other';
    stateCounts[st] = (stateCounts[st] || 0) + 1;
  }
  const byState = Object.entries(stateCounts)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);

  // Status Distribution
  const statusDist = [
    { status: 'Submitted', count: apps.filter((a) => a.status === 'Submitted').length, fill: '#3B82F6' },
    { status: 'Under Verification', count: apps.filter((a) => a.status === 'Under Verification').length, fill: '#F59E0B' },
    { status: 'Deficient', count: apps.filter((a) => a.status === 'Deficient').length, fill: '#EA580C' },
    { status: 'Eligible', count: apps.filter((a) => a.status === 'Eligible').length, fill: '#10B981' },
    { status: 'Shortlisted', count: apps.filter((a) => a.status === 'Shortlisted').length, fill: '#8B5CF6' },
    { status: 'Selected', count: apps.filter((a) => a.status === 'Selected').length, fill: '#059669' },
    { status: 'Ineligible / Rejected', count: apps.filter((a) => a.status === 'Ineligible' || a.status === 'Not Selected').length, fill: '#EF4444' },
  ];

  // Risk Distribution
  const riskDist = [
    { name: 'LOW Risk (>=85%)', count: apps.filter((a) => a.riskLevel === 'LOW').length, fill: '#16A34A' },
    { name: 'MEDIUM Risk (60-84%)', count: apps.filter((a) => a.riskLevel === 'MEDIUM').length, fill: '#D97706' },
    { name: 'HIGH Risk (<60%)', count: apps.filter((a) => a.riskLevel === 'HIGH').length, fill: '#DC2626' },
  ];

  // Deficiencies by Category
  const defs = db.getAllDeficiencies();
  const defCategoryMap: Record<string, number> = {};
  for (const d of defs) {
    defCategoryMap[d.category] = (defCategoryMap[d.category] || 0) + 1;
  }
  const deficiencyCategories = Object.entries(defCategoryMap).map(([category, count]) => ({ category, count }));

  // Average processing time by stage (mocked with realistic variance)
  const processingTimeDays = [
    { stage: 'Document Scrutiny', days: 2.4, targetDays: 3.0 },
    { stage: 'Deficiency Resolution', days: 4.8, targetDays: 7.0 },
    { stage: 'Eligibility Review', days: 1.2, targetDays: 2.0 },
    { stage: 'Screening & Merit', days: 3.5, targetDays: 5.0 },
    { stage: 'Final Selection', days: 2.1, targetDays: 4.0 },
  ];

  res.json({
    kpis: {
      total,
      pending,
      deficient,
      eligible,
      ineligible,
      shortlisted,
      selected,
      rejected,
    },
    byScheme,
    byState,
    statusDist,
    riskDist,
    deficiencyCategories,
    processingTimeDays,
  });
});
