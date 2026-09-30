import {
  Application,
  ApplicationDocument,
  CriterionEvaluationResult,
  EligibilityResult,
  SchemeRule,
} from '../types';

export class EligibilityEngine {
  public static evaluate(
    application: Application,
    documents: ApplicationDocument[],
    rules: SchemeRule[]
  ): EligibilityResult {
    const criteriaResults: CriterionEvaluationResult[] = [];
    const appData = application.data || {};

    let hasFail = false;
    let hasPending = false;
    let hasRequiresReview = false;

    for (const rule of rules) {
      let status: 'PASS' | 'FAIL' | 'PENDING' | 'REQUIRES_REVIEW' = 'PASS';
      let evidence = '';
      let conflictDetected: string | undefined = undefined;
      let fieldVal: any = undefined;
      let supportingDoc: ApplicationDocument | undefined = undefined;

      if (rule.targetType === 'document') {
        supportingDoc = documents.find((d) => d.docType === rule.targetKey || d.schemeDocId === rule.targetKey);

        if (rule.operator === 'documentExists') {
          if (!supportingDoc) {
            status = rule.type === 'required' ? 'FAIL' : 'REQUIRES_REVIEW';
            evidence = `Required document "${rule.targetKey}" is not uploaded.`;
            conflictDetected = 'Missing mandatory supporting document.';
          } else {
            status = 'PASS';
            evidence = `Document "${supportingDoc.title}" uploaded (${supportingDoc.fileStatus}).`;
          }
        } else if (rule.operator === 'documentVerified') {
          if (!supportingDoc) {
            status = 'FAIL';
            evidence = `Document "${rule.targetKey}" is not uploaded.`;
          } else if (supportingDoc.verificationStatus === 'Verified') {
            status = 'PASS';
            evidence = `Document "${supportingDoc.title}" verified by officer on ${supportingDoc.verifiedAt || 'record'}.`;
          } else if (supportingDoc.verificationStatus === 'Rejected') {
            status = 'FAIL';
            evidence = `Document "${supportingDoc.title}" was marked Rejected by verification officer: ${supportingDoc.verificationRemarks || 'Deficiency'}.`;
            conflictDetected = 'Document verification rejected.';
          } else {
            status = 'PENDING';
            evidence = `Document "${supportingDoc.title}" uploaded, official human verification is currently pending.`;
          }
        }
      } else {
        // Field based rule
        fieldVal = appData[rule.targetKey];

        // Fallbacks for profile level data
        if (fieldVal === undefined || fieldVal === null) {
          if (rule.targetKey === 'category') fieldVal = 'ST';
          if (rule.targetKey === 'annualIncome') fieldVal = appData.annualIncome;
        }

        if (fieldVal === undefined || fieldVal === null || fieldVal === '') {
          status = rule.type === 'required' ? 'FAIL' : 'PENDING';
          evidence = `Application field "${rule.targetKey}" is not specified.`;
          conflictDetected = 'Mandatory field incomplete.';
        } else {
          switch (rule.operator) {
            case 'equals':
              if (String(fieldVal).trim().toLowerCase() === String(rule.expectedValue).trim().toLowerCase()) {
                status = 'PASS';
                evidence = `Field "${rule.targetKey}" value "${fieldVal}" satisfies requirement (${rule.expectedValue}).`;
              } else {
                status = 'FAIL';
                evidence = `Field "${rule.targetKey}" value "${fieldVal}" does not match required value "${rule.expectedValue}".`;
                conflictDetected = `Mismatch in ${rule.targetKey}.`;
              }
              break;

            case 'notEquals':
              if (String(fieldVal).trim().toLowerCase() !== String(rule.expectedValue).trim().toLowerCase()) {
                status = 'PASS';
                evidence = `Field "${rule.targetKey}" satisfies requirement.`;
              } else {
                status = 'FAIL';
                evidence = `Field "${rule.targetKey}" value matches prohibited value "${rule.expectedValue}".`;
              }
              break;

            case 'greaterThanOrEqual':
              const numValGte = Number(fieldVal);
              const expValGte = Number(rule.expectedValue);
              if (!isNaN(numValGte) && numValGte >= expValGte) {
                status = 'PASS';
                evidence = `Reported value ${numValGte} meets or exceeds minimum requirement of ${expValGte}.`;
              } else {
                status = 'FAIL';
                evidence = `Reported value ${numValGte} is below required threshold of ${expValGte}.`;
                conflictDetected = `Threshold not met: ${numValGte} < ${expValGte}.`;
              }
              break;

            case 'lessThanOrEqual':
              const numValLte = Number(fieldVal);
              const expValLte = Number(rule.expectedValue);
              if (!isNaN(numValLte) && numValLte <= expValLte) {
                status = 'PASS';
                evidence = `Reported value ₹${numValLte.toLocaleString('en-IN')} is within maximum ceiling of ₹${expValLte.toLocaleString('en-IN')}.`;
              } else {
                status = 'FAIL';
                evidence = `Reported value ₹${numValLte.toLocaleString('en-IN')} exceeds maximum allowed limit of ₹${expValLte.toLocaleString('en-IN')}.`;
                conflictDetected = `Income ceiling exceeded.`;
              }
              break;

            case 'contains':
              if (Array.isArray(rule.expectedValue)) {
                const match = rule.expectedValue.some(
                  (v) => String(v).toLowerCase() === String(fieldVal).toLowerCase()
                );
                if (match) {
                  status = 'PASS';
                  evidence = `Qualification "${fieldVal}" recognized under eligible degrees (${rule.expectedValue.join(', ')}).`;
                } else {
                  status = 'FAIL';
                  evidence = `Qualification "${fieldVal}" is not in approved degrees: ${rule.expectedValue.join(', ')}.`;
                  conflictDetected = 'Unapproved degree/course.';
                }
              } else if (String(fieldVal).toLowerCase().includes(String(rule.expectedValue).toLowerCase())) {
                status = 'PASS';
                evidence = `Field "${rule.targetKey}" contains expected text "${rule.expectedValue}".`;
              } else {
                status = 'FAIL';
                evidence = `Field "${rule.targetKey}" does not match required qualification.`;
              }
              break;

            default:
              status = 'PASS';
              evidence = `Rule evaluated.`;
          }
        }
      }

      if (rule.type === 'required') {
        if (status === 'FAIL') hasFail = true;
        if (status === 'PENDING') hasPending = true;
        if (status === 'REQUIRES_REVIEW') hasRequiresReview = true;
      }

      const recommendedAction =
        status === 'PASS'
          ? 'Criteria fulfilled. No action needed.'
          : status === 'PENDING'
          ? 'Await document scrutiny and officer verification.'
          : status === 'REQUIRES_REVIEW'
          ? 'Officer review required to assess borderline or advisory condition.'
          : rule.failMessage || 'Candidate does not satisfy this eligibility condition.';

      criteriaResults.push({
        criterionId: rule.id,
        criterion: rule.criterion,
        type: rule.type,
        status,
        evidence,
        fieldUsed: rule.targetType === 'field' ? rule.targetKey : undefined,
        supportingDocType: rule.targetType === 'document' ? rule.targetKey : undefined,
        conflictDetected,
        recommendedAction,
      });
    }

    let overallStatus: 'Eligible' | 'Eligible subject to pending verification' | 'Ineligible' | 'Requires review' =
      'Eligible';

    if (hasFail) {
      overallStatus = 'Ineligible';
    } else if (hasRequiresReview) {
      overallStatus = 'Requires review';
    } else if (hasPending) {
      overallStatus = 'Eligible subject to pending verification';
    } else {
      overallStatus = 'Eligible';
    }

    const passedCount = criteriaResults.filter((c) => c.status === 'PASS').length;
    const totalCount = criteriaResults.length;

    const explanation = `Rule-based evaluation completed: ${passedCount} of ${totalCount} criteria satisfied. ${
      overallStatus === 'Eligible'
        ? 'The applicant satisfies all statutory conditions under the demo scheme configuration.'
        : overallStatus === 'Eligible subject to pending verification'
        ? 'Core criteria are satisfied, subject to official human verification of uploaded documents.'
        : overallStatus === 'Ineligible'
        ? 'One or more mandatory eligibility thresholds (such as marks, income ceiling or category) failed.'
        : 'One or more items require specialized manual review by the verification officer.'
    }`;

    return {
      applicationId: application.id,
      overallStatus,
      criteriaResults,
      explanation,
      evaluatedAt: new Date().toISOString(),
    };
  }
}
