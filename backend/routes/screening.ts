import { Router } from 'express';
import { db } from '../database/store';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

export const screeningRouter = Router();

// Get screening overview and candidate scores
screeningRouter.get('/', authenticate, requireRole(['officer', 'selection', 'admin']), (req: AuthenticatedRequest, res) => {
  const { schemeId, state, riskLevel, minMarks, sort = 'score' } = req.query;

  let apps = db.getApplications();

  // Focus on eligible / shortlisted / under review
  if (schemeId) {
    apps = apps.filter((a) => a.schemeId === schemeId);
  }
  if (state) {
    apps = apps.filter((a) => a.data?.state === state);
  }
  if (riskLevel) {
    apps = apps.filter((a) => a.riskLevel === riskLevel);
  }
  if (minMarks) {
    const min = Number(minMarks);
    apps = apps.filter((a) => {
      const marks = Number(a.data?.postgraduatePercentage || a.data?.marksPercentage || 0);
      return marks >= min;
    });
  }

  // Compute or retrieve screening scores
  const enrichedCandidates = apps.map((app) => {
    const scheme = db.findSchemeById(app.schemeId);
    const docs = db.getDocumentsByApplicationId(app.id);
    const consistency = db.getConsistency(app.id);
    const selection = db.findSelectionByApplicationId(app.id);

    // Compute live screening score based on configured selection criteria
    const criteria = scheme?.selectionCriteria || [];
    let totalScore = 0;
    const breakdown: Record<string, number> = {};

    const rawMarks = Number(app.data?.postgraduatePercentage || app.data?.marksPercentage || 70);
    const verifiedDocs = docs.filter((d) => d.verificationStatus === 'Verified').length;
    const totalDocs = docs.length || 1;

    for (const c of criteria) {
      let scoreVal = 0;
      if (c.sourceType === 'academic') {
        scoreVal = Math.min(c.weight, (rawMarks / 100) * c.weight);
      } else if (c.sourceType === 'research') {
        const hasTopic = !!app.data?.researchTopic || !!app.data?.foreignUniversity;
        scoreVal = hasTopic ? c.weight * 0.9 : c.weight * 0.5;
      } else if (c.sourceType === 'verification') {
        scoreVal = (verifiedDocs / totalDocs) * c.weight;
      } else if (c.sourceType === 'risk_penalty') {
        const cScore = consistency?.score ?? (app.consistencyScore ?? 85);
        scoreVal = (cScore / 100) * c.weight;
      }
      breakdown[c.code] = Math.round(scoreVal * 10) / 10;
      totalScore += scoreVal;
    }

    totalScore = Math.round(totalScore * 10) / 10;

    let aiRecommendation: 'Recommend shortlist' | 'Needs review' | 'Not recommended' = 'Needs review';
    let aiRecommendationReason = '';

    if (totalScore >= 75 && (app.consistencyScore ?? 100) >= 80 && app.eligibilityStatus !== 'Ineligible') {
      aiRecommendation = 'Recommend shortlist';
      aiRecommendationReason = `Merit score ${totalScore}/100 exceeds cutoff. Document integrity is high (${app.consistencyScore}%).`;
    } else if (app.eligibilityStatus === 'Ineligible' || (app.consistencyScore ?? 100) < 60) {
      aiRecommendation = 'Not recommended';
      aiRecommendationReason = 'Ineligible thresholds or high severity document inconsistencies detected.';
    } else {
      aiRecommendation = 'Needs review';
      aiRecommendationReason = 'Moderate score or document scrutiny pending.';
    }

    return {
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      applicantName: app.applicantName,
      schemeId: app.schemeId,
      schemeCode: scheme?.code || 'NFST',
      status: app.status,
      currentStage: app.currentStage,
      eligibilityStatus: app.eligibilityStatus || 'Requires review',
      consistencyScore: app.consistencyScore ?? (consistency?.score || 80),
      riskLevel: app.riskLevel || 'LOW',
      academicMarks: rawMarks,
      state: app.data?.state || 'Jharkhand',
      screeningScore: selection?.screeningScore ?? totalScore,
      scoreBreakdown: selection?.scoreBreakdown ?? breakdown,
      aiRecommendation: selection?.aiRecommendation ?? aiRecommendation,
      aiRecommendationReason: selection?.aiRecommendationReason ?? aiRecommendationReason,
      officerDecision: selection?.officerDecision ?? (app.officerDecision || 'Pending'),
      officerRemarks: selection?.officerRemarks ?? (app.officerRemarks || ''),
      finalizedAt: selection?.finalizedAt ?? app.finalizedAt,
    };
  });

  if (sort === 'score') {
    enrichedCandidates.sort((a, b) => b.screeningScore - a.screeningScore);
  } else if (sort === 'marks') {
    enrichedCandidates.sort((a, b) => b.academicMarks - a.academicMarks);
  }

  // Aggregate stats
  const allApps = db.getApplications();
  const stats = {
    totalApplications: allApps.length,
    eligible: allApps.filter((a) => a.eligibilityStatus === 'Eligible').length,
    ineligible: allApps.filter((a) => a.eligibilityStatus === 'Ineligible').length,
    pendingVerification: allApps.filter((a) => a.status === 'Submitted' || a.status === 'Under Verification').length,
    deficient: allApps.filter((a) => a.status === 'Deficient').length,
    highRisk: allApps.filter((a) => a.riskLevel === 'HIGH').length,
    shortlisted: allApps.filter((a) => a.status === 'Shortlisted').length,
    selected: allApps.filter((a) => a.status === 'Selected').length,
    rejected: allApps.filter((a) => a.status === 'Ineligible' || a.officerDecision === 'Reject').length,
  };

  res.json({
    stats,
    candidates: enrichedCandidates,
    fairnessNote: {
      message: 'Scores are computed strictly on academic merit, research relevance, document scrutiny completeness, and objective consistency. Demographic variables (gender, religion, personal names) are strictly excluded from ranking algorithms.',
      consideredFields: ['Qualifying marks percentage', 'Research proposal synopsis', 'Statutory document verification status', 'Document consistency and integrity score'],
    },
  });
});
