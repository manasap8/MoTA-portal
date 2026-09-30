import { db } from '../database/store';

export interface AssistantResponse {
  answer: string;
  sources: string[];
  suggestedQuestions: string[];
  relatedApplicationId?: string;
  isAiEnhanced: boolean;
}

export class AiAssistantService {
  public static async query(userQuery: string, userRole: string): Promise<AssistantResponse> {
    const q = userQuery.trim().toLowerCase();

    // 1. Extract Application Number if present (e.g. NFST-2025-001, APP-2025-0004, or internal ID)
    const appMatch = userQuery.match(/(?:NFST|NOS|APP|SCH)[-_A-Z0-9]+/i) || userQuery.match(/app_[a-z0-9_]+/i);
    let appNumber = appMatch ? appMatch[0].toUpperCase() : undefined;

    // Check if query refers to "this application" or numeric reference
    let targetApp = appNumber ? db.findApplicationById(appNumber) : undefined;
    if (!targetApp && appNumber) {
      // Try search in application list
      targetApp = db.getApplications().find(
        (a) => a.applicationNumber.toLowerCase().includes(appNumber!.toLowerCase()) || a.id.toLowerCase() === appNumber!.toLowerCase()
      );
    }

    // If query is about overall counts or aggregates
    if (q.includes('how many') || q.includes('count') || q.includes('total applications') || q.includes('summary statistics')) {
      const apps = db.getApplications();
      const pendingVer = apps.filter((a) => a.status === 'Submitted' || a.status === 'Under Verification').length;
      const deficient = apps.filter((a) => a.status === 'Deficient').length;
      const eligible = apps.filter((a) => a.status === 'Eligible' || a.status === 'Shortlisted' || a.status === 'Selected').length;
      const highRisk = apps.filter((a) => a.riskLevel === 'HIGH').length;

      return {
        answer: `Currently in the system, there are **${apps.length} total applications** across NFST and NOS schemes. Breakdown:
- **${pendingVer} applications** are pending document scrutiny / under verification.
- **${deficient} applications** have open deficiencies awaiting applicant resubmission.
- **${eligible} applications** are verified eligible or proceeding through screening.
- **${highRisk} applications** are flagged with HIGH risk advisory alerts requiring priority scrutiny.`,
        sources: ['database:applications', 'audit_logs'],
        suggestedQuestions: [
          'Show high-risk applications',
          'Which applications are deficient?',
          'What are the primary causes for deficiency?',
        ],
        isAiEnhanced: false,
      };
    }

    // If query asks for high-risk applications
    if (q.includes('high risk') || q.includes('flagged applications')) {
      const highRiskApps = db.getApplications().filter((a) => a.riskLevel === 'HIGH');
      const list = highRiskApps
        .map(
          (a) =>
            `- **${a.applicationNumber}** (${a.applicantName}) - Scheme: ${a.schemeId.toUpperCase()}, Consistency: ${a.consistencyScore}%, Status: ${a.status}`
        )
        .join('\n');

      return {
        answer: `There are **${highRiskApps.length} applications** categorized with HIGH risk advisory findings:\n\n${list}\n\n*Recommendation: Open these records in the 3-Column Review page to review the specific certificate inconsistencies.*`,
        sources: ['database:applications', 'consistency_results'],
        suggestedQuestions: highRiskApps.slice(0, 3).map((a) => `Why was ${a.applicationNumber} flagged?`),
        isAiEnhanced: false,
      };
    }

    // If target application was identified
    if (targetApp) {
      const docs = db.getDocumentsByApplicationId(targetApp.id);
      const consistency = db.getConsistency(targetApp.id);
      const eligibility = db.getEligibility(targetApp.id);
      const deficiencies = db.getDeficienciesByApplicationId(targetApp.id);

      // Question: Why is it pending or flagged?
      if (q.includes('why') || q.includes('flag') || q.includes('pending') || q.includes('inconsistent') || q.includes('issue')) {
        let text = `### Analysis for Application **${targetApp.applicationNumber}** (${targetApp.applicantName}):\n\n`;
        text += `- **Current Status**: ${targetApp.status} (Stage: ${targetApp.currentStage})\n`;
        text += `- **Consistency Score**: ${targetApp.consistencyScore ?? (consistency?.score || 'N/A')}% (Advisory Risk: **${targetApp.riskLevel || 'LOW'}**)\n`;

        if (deficiencies.filter((d) => d.status !== 'Resolved').length > 0) {
          text += `\n**Open Deficiencies (${deficiencies.filter((d) => d.status !== 'Resolved').length}):**\n`;
          deficiencies
            .filter((d) => d.status !== 'Resolved')
            .forEach((d) => {
              text += `- **${d.title}**: ${d.description} (Due: ${d.dueDate}, Status: ${d.status})\n`;
            });
        }

        if (consistency && consistency.findings.length > 0) {
          const warningsOrFails = consistency.findings.filter((f) => f.status === 'FAIL' || f.status === 'WARNING');
          if (warningsOrFails.length > 0) {
            text += `\n**Key Automated Inconsistencies:**\n`;
            warningsOrFails.forEach((f) => {
              text += `- **[${f.status}] ${f.title}**: ${f.details}\n`;
            });
          }
        }

        if (eligibility) {
          const failedRules = eligibility.criteriaResults.filter((c) => c.status === 'FAIL');
          if (failedRules.length > 0) {
            text += `\n**Failed Eligibility Criteria:**\n`;
            failedRules.forEach((r) => {
              text += `- ${r.criterion}: ${r.evidence} (Action: ${r.recommendedAction})\n`;
            });
          }
        }

        return {
          answer: text,
          sources: ['eligibility_results', 'document_checks', 'deficiencies'],
          suggestedQuestions: [
            `What documents are missing for ${targetApp.applicationNumber}?`,
            `How was the consistency score calculated for ${targetApp.applicationNumber}?`,
            `What is the officer recommendation for ${targetApp.applicationNumber}?`,
          ],
          relatedApplicationId: targetApp.id,
          isAiEnhanced: false,
        };
      }

      // Question: Missing documents
      if (q.includes('missing') || q.includes('document')) {
        const scheme = db.findSchemeById(targetApp.schemeId);
        const reqDocs = scheme?.requiredDocuments || [];
        const uploadedTypes = new Set(docs.map((d) => d.docType));
        const missing = reqDocs.filter((r) => r.mandatory && !uploadedTypes.has(r.code));

        if (missing.length === 0) {
          return {
            answer: `All mandatory documents for **${targetApp.applicationNumber}** have been uploaded (${docs.length} documents on file). Verification status: ${
              docs.filter((d) => d.verificationStatus === 'Verified').length
            } Verified, ${docs.filter((d) => d.verificationStatus === 'Pending').length} Pending Scrutiny.`,
            sources: ['scheme_documents', 'application_documents'],
            suggestedQuestions: [`Why was ${targetApp.applicationNumber} flagged?`],
            relatedApplicationId: targetApp.id,
            isAiEnhanced: false,
          };
        } else {
          return {
            answer: `Application **${targetApp.applicationNumber}** is missing **${missing.length} mandatory document(s)**:\n` +
              missing.map((m) => `- **${m.title}** (${m.code}): ${m.description}`).join('\n'),
            sources: ['scheme_documents', 'application_documents', 'deficiencies'],
            suggestedQuestions: [
              `Raise deficiency for ${targetApp.applicationNumber}`,
              `Check consistency for ${targetApp.applicationNumber}`,
            ],
            relatedApplicationId: targetApp.id,
            isAiEnhanced: false,
          };
        }
      }
    }

    // General fallback
    return {
      answer: `I can assist you with application investigations, document verification analysis, deficiency tracking, and screening queries.
You can ask:
- *"Why is application NFST-2025-003 pending?"*
- *"What documents are missing for NOS-2025-002?"*
- *"Show all high-risk applications"*
- *"How many applications are pending document verification?"*
- *"Which eligibility criteria failed for NOS-2025-009?"*`,
      sources: ['system_knowledge'],
      suggestedQuestions: [
        'Why is application NFST-2025-003 pending?',
        'What documents are missing for NOS-2025-002?',
        'Show all high-risk applications',
        'How many applications are pending document verification?',
      ],
      isAiEnhanced: false,
    };
  }
}
