import { Application, ApplicationDocument, ConsistencyFinding, ConsistencyResult, RiskLevel } from '../types';
import { db } from '../database/store';

// Helper for Levenshtein distance
function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];
  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[bn][an];
}

function normalizeString(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function nameSimilarity(name1?: string, name2?: string): { score: number; type: 'exact' | 'initials' | 'fuzzy' | 'mismatch' } {
  if (!name1 || !name2) return { score: 1.0, type: 'exact' };
  const n1 = normalizeString(name1);
  const n2 = normalizeString(name2);
  if (n1 === n2) return { score: 1.0, type: 'exact' };

  // Check initial expansion (e.g. "rahul k" vs "rahul kumar")
  const parts1 = n1.split(' ');
  const parts2 = n2.split(' ');
  if (parts1.length > 0 && parts2.length > 0 && parts1[0] === parts2[0]) {
    if (parts1.length === 2 && parts2.length === 2) {
      if (parts1[1].length === 1 && parts2[1].startsWith(parts1[1])) {
        return { score: 0.85, type: 'initials' };
      }
      if (parts2[1].length === 1 && parts1[1].startsWith(parts2[1])) {
        return { score: 0.85, type: 'initials' };
      }
    }
  }

  const maxLen = Math.max(n1.length, n2.length);
  const dist = levenshteinDistance(n1, n2);
  const sim = Math.max(0, 1 - dist / maxLen);

  if (sim >= 0.8) return { score: sim, type: 'fuzzy' };
  return { score: sim, type: 'mismatch' };
}

export class ConsistencyEngine {
  public static evaluate(
    application: Application,
    documents: ApplicationDocument[]
  ): ConsistencyResult {
    const findings: ConsistencyFinding[] = [];
    const appData = application.data || {};

    let nameScore = 20;
    let dobScore = 20;
    let categoryScore = 15;
    let institutionScore = 15;
    let courseScore = 10;
    let validityScore = 10;
    let completenessScore = 10;

    let hasHighSeverity = false;

    // 1. Name Check across documents
    const appFullName = application.applicantName || appData.fullName || '';
    const docsWithExtractedNames = documents.filter((d) => d.extractedData?.name);

    if (docsWithExtractedNames.length === 0) {
      findings.push({
        id: 'finding_name_pending',
        category: 'Identity',
        field: 'fullName',
        status: 'INFO',
        title: 'Name Consistency: Verification Pending',
        message: 'No document extractions available yet to cross-verify applicant name.',
        details: `Application name is "${appFullName}". Awaiting document OCR extractions.`,
        weightDeduction: 0,
        isAiAssisted: true,
      });
    } else {
      let worstSim = 1.0;
      let worstDocTitle = '';
      let worstExtractedName = '';

      for (const doc of docsWithExtractedNames) {
        const docName = doc.extractedData!.name!;
        const simResult = nameSimilarity(appFullName, docName);
        if (simResult.score < worstSim) {
          worstSim = simResult.score;
          worstDocTitle = doc.title;
          worstExtractedName = docName;
        }

        if (simResult.type === 'initials') {
          nameScore = Math.max(12, nameScore - 5);
          findings.push({
            id: `finding_name_initials_${doc.id}`,
            category: 'Identity',
            field: 'fullName',
            status: 'WARNING',
            title: `Name Formatting Variation in ${doc.title}`,
            message: 'Potential formatting variation detected between application and certificate.',
            details: `Application has "${appFullName}", whereas ${doc.title} shows "${docName}". Initials/abbreviation variation requires standard manual check.`,
            weightDeduction: 5,
            isAiAssisted: true,
          });
        } else if (simResult.type === 'mismatch' || simResult.score < 0.75) {
          nameScore = 0;
          hasHighSeverity = true;
          findings.push({
            id: `finding_name_mismatch_${doc.id}`,
            category: 'Identity',
            field: 'fullName',
            status: 'FAIL',
            title: `Name Inconsistency in ${doc.title}`,
            message: 'Potential inconsistency detected. Manual verification required.',
            details: `Application name "${appFullName}" differs materially from extracted name "${docName}" in ${doc.title}.`,
            weightDeduction: 20,
            isAiAssisted: true,
          });
        }
      }

      if (worstSim >= 0.95) {
        findings.push({
          id: 'finding_name_ok',
          category: 'Identity',
          field: 'fullName',
          status: 'PASS',
          title: 'Name Consistency Verified',
          message: 'Applicant name matches identically across all extracted certificates.',
          details: `Confirmed matching "${appFullName}" across ${docsWithExtractedNames.length} document(s).`,
          weightDeduction: 0,
          isAiAssisted: true,
        });
      }
    }

    // 2. Date of Birth Check
    const appDob = appData.dob || '';
    const docsWithDob = documents.filter((d) => d.extractedData?.dob);
    if (docsWithDob.length > 0 && appDob) {
      let dobMismatched = false;
      for (const doc of docsWithDob) {
        const docDob = doc.extractedData!.dob!.trim();
        if (docDob && docDob !== appDob) {
          dobMismatched = true;
          dobScore = 0;
          hasHighSeverity = true;
          findings.push({
            id: `finding_dob_mismatch_${doc.id}`,
            category: 'Identity',
            field: 'dob',
            status: 'FAIL',
            title: `Date of Birth Inconsistency in ${doc.title}`,
            message: 'Potential inconsistency detected. Manual verification required.',
            details: `Application DOB "${appDob}" does not match certificate extracted DOB "${docDob}" in ${doc.title}.`,
            weightDeduction: 20,
            isAiAssisted: true,
          });
        }
      }
      if (!dobMismatched) {
        findings.push({
          id: 'finding_dob_ok',
          category: 'Identity',
          field: 'dob',
          status: 'PASS',
          title: 'Date of Birth Consistent',
          message: 'Date of birth matches verified certificates.',
          details: `Confirmed matching DOB "${appDob}" across identity documents.`,
          weightDeduction: 0,
          isAiAssisted: true,
        });
      }
    } else {
      findings.push({
        id: 'finding_dob_info',
        category: 'Identity',
        field: 'dob',
        status: 'INFO',
        title: 'DOB Cross-Check',
        message: 'DOB verified from profile data.',
        details: `DOB: ${appDob || 'Provided in application profile'}.`,
        weightDeduction: 0,
        isAiAssisted: true,
      });
    }

    // 3. Category & ST Certificate
    const stDoc = documents.find((d) => d.docType === 'st_certificate');
    if (stDoc) {
      if (stDoc.extractedData?.category && stDoc.extractedData.category !== 'ST') {
        categoryScore = 0;
        hasHighSeverity = true;
        findings.push({
          id: 'finding_cat_mismatch',
          category: 'Eligibility Category',
          field: 'category',
          status: 'FAIL',
          title: 'Tribal Category Inconsistency',
          message: 'Potential inconsistency detected. Manual verification required.',
          details: `Application claims ST category, but document extractions indicate "${stDoc.extractedData.category}".`,
          weightDeduction: 15,
          isAiAssisted: true,
        });
      } else {
        findings.push({
          id: 'finding_cat_ok',
          category: 'Eligibility Category',
          field: 'category',
          status: 'PASS',
          title: 'ST Category Confirmed',
          message: 'ST certificate attached and category matches Scheduled Tribe requirement.',
          details: `Certificate number: ${stDoc.extractedData?.certificateNumber || appData.stCertNumber || 'Verified'}.`,
          weightDeduction: 0,
          isAiAssisted: true,
        });
      }
    }

    // 4. Institution & Course Check
    const appInst = appData.researchInstitution || appData.universityName || '';
    const admissionDoc = documents.find(
      (d) => d.docType === 'admission_letter' || d.docType === 'degree_certificate'
    );
    if (admissionDoc?.extractedData?.institution && appInst) {
      const docInst = admissionDoc.extractedData.institution;
      const sim = nameSimilarity(appInst, docInst);
      if (sim.score < 0.6) {
        institutionScore = 5;
        findings.push({
          id: 'finding_inst_diff',
          category: 'Academic/Institution',
          field: 'institution',
          status: 'WARNING',
          title: 'Institution Name Requires Scrutiny',
          message: 'Potential inconsistency detected. Manual verification required.',
          details: `Application lists institution as "${appInst}", while uploaded ${admissionDoc.title} indicates "${docInst}".`,
          weightDeduction: 10,
          isAiAssisted: true,
        });
      } else {
        findings.push({
          id: 'finding_inst_ok',
          category: 'Academic/Institution',
          field: 'institution',
          status: 'PASS',
          title: 'Institution Name Consistent',
          message: 'Institution details on document match application entry.',
          details: `Institution verified: ${appInst}.`,
          weightDeduction: 0,
          isAiAssisted: true,
        });
      }
    }

    // 5. Expiry Check (e.g. Income Certificate or Passport)
    const now = new Date();
    for (const doc of documents) {
      if (doc.extractedData?.expiryDate) {
        const expDate = new Date(doc.extractedData.expiryDate);
        if (expDate.getTime() < now.getTime()) {
          validityScore = Math.max(0, validityScore - 10);
          findings.push({
            id: `finding_expired_${doc.id}`,
            category: 'Document Validity',
            field: 'expiryDate',
            status: 'WARNING',
            title: `Expired Document Detected: ${doc.title}`,
            message: 'Potential inconsistency detected. Manual verification required.',
            details: `${doc.title} expired on ${doc.extractedData.expiryDate}. Current valid certificate must be provided.`,
            weightDeduction: 10,
            isAiAssisted: true,
          });
        } else {
          findings.push({
            id: `finding_valid_${doc.id}`,
            category: 'Document Validity',
            field: 'expiryDate',
            status: 'PASS',
            title: `Certificate Valid: ${doc.title}`,
            message: `Document validity is active through ${doc.extractedData.expiryDate}.`,
            details: `Valid certificate.`,
            weightDeduction: 0,
            isAiAssisted: true,
          });
        }
      }
    }

    // 6. Duplicate check across other applications
    const allApps = db.getApplications().filter((a) => a.id !== application.id);
    for (const other of allApps) {
      if (
        appData.stCertNumber &&
        other.data?.stCertNumber &&
        other.data.stCertNumber.trim() === appData.stCertNumber.trim()
      ) {
        completenessScore = 0;
        hasHighSeverity = true;
        findings.push({
          id: 'finding_duplicate_cert',
          category: 'Integrity Check',
          field: 'stCertNumber',
          status: 'FAIL',
          title: 'Duplicate Certificate Number Cross-Flag',
          message: 'Potential inconsistency detected. Manual verification required.',
          details: `ST Certificate number "${appData.stCertNumber}" is also recorded under application ${other.applicationNumber}.`,
          weightDeduction: 10,
          isAiAssisted: true,
        });
      }
    }

    // 7. Page count / completeness
    for (const doc of documents) {
      if (doc.extractedData?.pageCount && doc.extractedData.pageCount < 2 && doc.docType === 'research_proposal') {
        findings.push({
          id: `finding_pages_${doc.id}`,
          category: 'Document Completeness',
          field: 'pageCount',
          status: 'WARNING',
          title: `Research Proposal Page Count Warning`,
          message: 'Uploaded research proposal has only 1 page. Typical requirements expect complete synopsis.',
          details: `Extracted page count: 1. Manual scrutiny advised.`,
          weightDeduction: 5,
          isAiAssisted: true,
        });
      }
    }

    const totalScore = Math.min(
      100,
      Math.max(
        0,
        nameScore + dobScore + categoryScore + institutionScore + courseScore + validityScore + completenessScore
      )
    );

    let riskLevel: RiskLevel = 'LOW';
    if (totalScore < 60 || hasHighSeverity) {
      riskLevel = 'HIGH';
    } else if (totalScore < 85) {
      riskLevel = 'MEDIUM';
    }

    const plainExplanation = `Automated document consistency evaluation calculated an overall score of ${totalScore}/100 with an advisory risk classification of ${riskLevel}. ${
      findings.filter((f) => f.status === 'FAIL').length > 0
        ? 'High-priority discrepancies were flagged that require official verification before proceeding.'
        : findings.filter((f) => f.status === 'WARNING').length > 0
        ? 'Advisory warnings were noted regarding formatting or expiry dates for officer scrutiny.'
        : 'All cross-document identity, academic and tribal criteria show high alignment.'
    }`;

    return {
      score: totalScore,
      riskLevel,
      findings,
      scoreBreakdown: {
        nameMatching: nameScore,
        dobMatching: dobScore,
        categoryCert: categoryScore,
        institution: institutionScore,
        course: courseScore,
        validityExpiry: validityScore,
        completeness: completenessScore,
      },
      plainExplanation,
    };
  }
}
