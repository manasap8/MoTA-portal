// server-dev.ts
import express from "express";
import path4 from "path";
import fs5 from "fs";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// backend/database/seed.ts
import bcrypt from "bcryptjs";
import fs2 from "fs";
import path2 from "path";

// backend/database/store.ts
import fs from "fs";
import path from "path";
var DatabaseStore = class {
  constructor() {
    this.isSaving = false;
    this.savePending = false;
    this.dataDir = path.resolve(process.env.DATA_DIR || "./data");
    this.dbFilePath = path.join(this.dataDir, "database.json");
    this.memoryData = this.getEmptySchema();
    this.init();
  }
  getEmptySchema() {
    return {
      users: [],
      applicants: [],
      schemes: [],
      applications: [],
      documents: [],
      deficiencies: [],
      eligibilityResults: {},
      consistencyResults: {},
      selectionRecords: [],
      postSelectionRecords: [],
      progressRecords: [],
      notifications: [],
      communications: [],
      auditLogs: [],
      aiCache: {}
    };
  }
  init() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, "utf-8");
        this.memoryData = { ...this.getEmptySchema(), ...JSON.parse(raw) };
      } else {
        this.persistSync();
      }
    } catch (err) {
      console.error("Error initializing database store:", err);
      this.memoryData = this.getEmptySchema();
    }
  }
  persistSync() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.memoryData, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to persist database synchronously:", err);
    }
  }
  async persist() {
    if (this.isSaving) {
      this.savePending = true;
      return;
    }
    this.isSaving = true;
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const tmpPath = `${this.dbFilePath}.tmp`;
      await fs.promises.writeFile(tmpPath, JSON.stringify(this.memoryData, null, 2), "utf-8");
      await fs.promises.rename(tmpPath, this.dbFilePath);
    } catch (err) {
      console.error("Failed to persist database:", err);
    } finally {
      this.isSaving = false;
      if (this.savePending) {
        this.savePending = false;
        this.persist();
      }
    }
  }
  getData() {
    return this.memoryData;
  }
  replaceAll(newData) {
    this.memoryData = newData;
    this.persistSync();
  }
  // --- Users ---
  findUserById(id) {
    return this.memoryData.users.find((u) => u.id === id);
  }
  findUserByEmail(email) {
    return this.memoryData.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  saveUser(user) {
    const idx = this.memoryData.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.memoryData.users[idx] = user;
    } else {
      this.memoryData.users.push(user);
    }
    this.persist();
  }
  // --- Applicants ---
  findApplicantByUserId(userId) {
    return this.memoryData.applicants.find((a) => a.userId === userId);
  }
  findApplicantById(id) {
    return this.memoryData.applicants.find((a) => a.id === id);
  }
  saveApplicant(profile) {
    const idx = this.memoryData.applicants.findIndex((a) => a.id === profile.id);
    if (idx >= 0) {
      this.memoryData.applicants[idx] = profile;
    } else {
      this.memoryData.applicants.push(profile);
    }
    this.persist();
  }
  // --- Schemes ---
  getSchemes() {
    return this.memoryData.schemes;
  }
  findSchemeById(id) {
    return this.memoryData.schemes.find((s) => s.id === id || s.code.toLowerCase() === id.toLowerCase());
  }
  saveScheme(scheme) {
    const idx = this.memoryData.schemes.findIndex((s) => s.id === scheme.id);
    if (idx >= 0) {
      this.memoryData.schemes[idx] = scheme;
    } else {
      this.memoryData.schemes.push(scheme);
    }
    this.persist();
  }
  // --- Applications ---
  getApplications() {
    return this.memoryData.applications;
  }
  findApplicationById(id) {
    return this.memoryData.applications.find((a) => a.id === id || a.applicationNumber === id);
  }
  findApplicationsByApplicantId(applicantId) {
    return this.memoryData.applications.filter((a) => a.applicantId === applicantId);
  }
  saveApplication(application) {
    const idx = this.memoryData.applications.findIndex((a) => a.id === application.id);
    if (idx >= 0) {
      this.memoryData.applications[idx] = application;
    } else {
      this.memoryData.applications.push(application);
    }
    this.persist();
  }
  // --- Documents ---
  getDocumentsByApplicationId(applicationId) {
    return this.memoryData.documents.filter((d) => d.applicationId === applicationId);
  }
  findDocumentById(id) {
    return this.memoryData.documents.find((d) => d.id === id);
  }
  saveDocument(doc) {
    const idx = this.memoryData.documents.findIndex((d) => d.id === doc.id);
    if (idx >= 0) {
      this.memoryData.documents[idx] = doc;
    } else {
      this.memoryData.documents.push(doc);
    }
    this.persist();
  }
  deleteDocument(id) {
    this.memoryData.documents = this.memoryData.documents.filter((d) => d.id !== id);
    this.persist();
  }
  // --- Consistency Results ---
  getConsistency(applicationId) {
    return this.memoryData.consistencyResults[applicationId];
  }
  saveConsistency(applicationId, result) {
    this.memoryData.consistencyResults[applicationId] = result;
    this.persist();
  }
  // --- Eligibility Results ---
  getEligibility(applicationId) {
    return this.memoryData.eligibilityResults[applicationId];
  }
  saveEligibility(applicationId, result) {
    this.memoryData.eligibilityResults[applicationId] = result;
    this.persist();
  }
  // --- Deficiencies ---
  getDeficienciesByApplicationId(applicationId) {
    return this.memoryData.deficiencies.filter((d) => d.applicationId === applicationId);
  }
  getAllDeficiencies() {
    return this.memoryData.deficiencies;
  }
  findDeficiencyById(id) {
    return this.memoryData.deficiencies.find((d) => d.id === id);
  }
  saveDeficiency(deficiency) {
    const idx = this.memoryData.deficiencies.findIndex((d) => d.id === deficiency.id);
    if (idx >= 0) {
      this.memoryData.deficiencies[idx] = deficiency;
    } else {
      this.memoryData.deficiencies.push(deficiency);
    }
    this.persist();
  }
  // --- Selection Records ---
  getSelectionRecords() {
    return this.memoryData.selectionRecords;
  }
  findSelectionByApplicationId(applicationId) {
    return this.memoryData.selectionRecords.find((s) => s.applicationId === applicationId);
  }
  saveSelectionRecord(record) {
    const idx = this.memoryData.selectionRecords.findIndex((s) => s.id === record.id);
    if (idx >= 0) {
      this.memoryData.selectionRecords[idx] = record;
    } else {
      this.memoryData.selectionRecords.push(record);
    }
    this.persist();
  }
  // --- Post Selection Records ---
  getPostSelectionRecords() {
    return this.memoryData.postSelectionRecords;
  }
  findPostSelectionByApplicationId(applicationId) {
    return this.memoryData.postSelectionRecords.find((p) => p.applicationId === applicationId);
  }
  savePostSelectionRecord(record) {
    const idx = this.memoryData.postSelectionRecords.findIndex((p) => p.id === record.id);
    if (idx >= 0) {
      this.memoryData.postSelectionRecords[idx] = record;
    } else {
      this.memoryData.postSelectionRecords.push(record);
    }
    this.persist();
  }
  // --- Progress Records ---
  getProgressRecordsByApplicationId(applicationId) {
    return this.memoryData.progressRecords.filter((p) => p.applicationId === applicationId);
  }
  saveProgressRecord(record) {
    const idx = this.memoryData.progressRecords.findIndex((p) => p.id === record.id);
    if (idx >= 0) {
      this.memoryData.progressRecords[idx] = record;
    } else {
      this.memoryData.progressRecords.push(record);
    }
    this.persist();
  }
  // --- Notifications ---
  getNotificationsByUserId(userId) {
    return this.memoryData.notifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  addNotification(notification) {
    this.memoryData.notifications.unshift(notification);
    this.persist();
  }
  markNotificationAsRead(id, userId) {
    const item = this.memoryData.notifications.find((n) => n.id === id && n.userId === userId);
    if (item) {
      item.isRead = true;
      this.persist();
    }
  }
  markAllNotificationsAsRead(userId) {
    this.memoryData.notifications.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    this.persist();
  }
  // --- Communications ---
  getCommunicationsByApplicationId(applicationId) {
    return this.memoryData.communications.filter((c) => c.applicationId === applicationId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  addCommunication(comm) {
    this.memoryData.communications.push(comm);
    this.persist();
  }
  // --- Audit Logs (Append-Only) ---
  getAuditLogs() {
    return [...this.memoryData.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
  addAuditLog(entry) {
    const log = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.memoryData.auditLogs.push(log);
    this.persist();
  }
  // --- AI Cache ---
  getCachedAi(key) {
    return this.memoryData.aiCache[key];
  }
  setCachedAi(key, value) {
    this.memoryData.aiCache[key] = value;
    this.persist();
  }
};
var db = new DatabaseStore();

// backend/ai/consistencyEngine.ts
function levenshteinDistance(a, b) {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = [];
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
          matrix[i - 1][j - 1] + 1,
          // substitution
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[bn][an];
}
function normalizeString(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}
function nameSimilarity(name1, name2) {
  if (!name1 || !name2) return { score: 1, type: "exact" };
  const n1 = normalizeString(name1);
  const n2 = normalizeString(name2);
  if (n1 === n2) return { score: 1, type: "exact" };
  const parts1 = n1.split(" ");
  const parts2 = n2.split(" ");
  if (parts1.length > 0 && parts2.length > 0 && parts1[0] === parts2[0]) {
    if (parts1.length === 2 && parts2.length === 2) {
      if (parts1[1].length === 1 && parts2[1].startsWith(parts1[1])) {
        return { score: 0.85, type: "initials" };
      }
      if (parts2[1].length === 1 && parts1[1].startsWith(parts2[1])) {
        return { score: 0.85, type: "initials" };
      }
    }
  }
  const maxLen = Math.max(n1.length, n2.length);
  const dist = levenshteinDistance(n1, n2);
  const sim = Math.max(0, 1 - dist / maxLen);
  if (sim >= 0.8) return { score: sim, type: "fuzzy" };
  return { score: sim, type: "mismatch" };
}
var ConsistencyEngine = class {
  static evaluate(application, documents) {
    const findings = [];
    const appData = application.data || {};
    let nameScore = 20;
    let dobScore = 20;
    let categoryScore = 15;
    let institutionScore = 15;
    let courseScore = 10;
    let validityScore = 10;
    let completenessScore = 10;
    let hasHighSeverity = false;
    const appFullName = application.applicantName || appData.fullName || "";
    const docsWithExtractedNames = documents.filter((d) => d.extractedData?.name);
    if (docsWithExtractedNames.length === 0) {
      findings.push({
        id: "finding_name_pending",
        category: "Identity",
        field: "fullName",
        status: "INFO",
        title: "Name Consistency: Verification Pending",
        message: "No document extractions available yet to cross-verify applicant name.",
        details: `Application name is "${appFullName}". Awaiting document OCR extractions.`,
        weightDeduction: 0,
        isAiAssisted: true
      });
    } else {
      let worstSim = 1;
      let worstDocTitle = "";
      let worstExtractedName = "";
      for (const doc of docsWithExtractedNames) {
        const docName = doc.extractedData.name;
        const simResult = nameSimilarity(appFullName, docName);
        if (simResult.score < worstSim) {
          worstSim = simResult.score;
          worstDocTitle = doc.title;
          worstExtractedName = docName;
        }
        if (simResult.type === "initials") {
          nameScore = Math.max(12, nameScore - 5);
          findings.push({
            id: `finding_name_initials_${doc.id}`,
            category: "Identity",
            field: "fullName",
            status: "WARNING",
            title: `Name Formatting Variation in ${doc.title}`,
            message: "Potential formatting variation detected between application and certificate.",
            details: `Application has "${appFullName}", whereas ${doc.title} shows "${docName}". Initials/abbreviation variation requires standard manual check.`,
            weightDeduction: 5,
            isAiAssisted: true
          });
        } else if (simResult.type === "mismatch" || simResult.score < 0.75) {
          nameScore = 0;
          hasHighSeverity = true;
          findings.push({
            id: `finding_name_mismatch_${doc.id}`,
            category: "Identity",
            field: "fullName",
            status: "FAIL",
            title: `Name Inconsistency in ${doc.title}`,
            message: "Potential inconsistency detected. Manual verification required.",
            details: `Application name "${appFullName}" differs materially from extracted name "${docName}" in ${doc.title}.`,
            weightDeduction: 20,
            isAiAssisted: true
          });
        }
      }
      if (worstSim >= 0.95) {
        findings.push({
          id: "finding_name_ok",
          category: "Identity",
          field: "fullName",
          status: "PASS",
          title: "Name Consistency Verified",
          message: "Applicant name matches identically across all extracted certificates.",
          details: `Confirmed matching "${appFullName}" across ${docsWithExtractedNames.length} document(s).`,
          weightDeduction: 0,
          isAiAssisted: true
        });
      }
    }
    const appDob = appData.dob || "";
    const docsWithDob = documents.filter((d) => d.extractedData?.dob);
    if (docsWithDob.length > 0 && appDob) {
      let dobMismatched = false;
      for (const doc of docsWithDob) {
        const docDob = doc.extractedData.dob.trim();
        if (docDob && docDob !== appDob) {
          dobMismatched = true;
          dobScore = 0;
          hasHighSeverity = true;
          findings.push({
            id: `finding_dob_mismatch_${doc.id}`,
            category: "Identity",
            field: "dob",
            status: "FAIL",
            title: `Date of Birth Inconsistency in ${doc.title}`,
            message: "Potential inconsistency detected. Manual verification required.",
            details: `Application DOB "${appDob}" does not match certificate extracted DOB "${docDob}" in ${doc.title}.`,
            weightDeduction: 20,
            isAiAssisted: true
          });
        }
      }
      if (!dobMismatched) {
        findings.push({
          id: "finding_dob_ok",
          category: "Identity",
          field: "dob",
          status: "PASS",
          title: "Date of Birth Consistent",
          message: "Date of birth matches verified certificates.",
          details: `Confirmed matching DOB "${appDob}" across identity documents.`,
          weightDeduction: 0,
          isAiAssisted: true
        });
      }
    } else {
      findings.push({
        id: "finding_dob_info",
        category: "Identity",
        field: "dob",
        status: "INFO",
        title: "DOB Cross-Check",
        message: "DOB verified from profile data.",
        details: `DOB: ${appDob || "Provided in application profile"}.`,
        weightDeduction: 0,
        isAiAssisted: true
      });
    }
    const stDoc = documents.find((d) => d.docType === "st_certificate");
    if (stDoc) {
      if (stDoc.extractedData?.category && stDoc.extractedData.category !== "ST") {
        categoryScore = 0;
        hasHighSeverity = true;
        findings.push({
          id: "finding_cat_mismatch",
          category: "Eligibility Category",
          field: "category",
          status: "FAIL",
          title: "Tribal Category Inconsistency",
          message: "Potential inconsistency detected. Manual verification required.",
          details: `Application claims ST category, but document extractions indicate "${stDoc.extractedData.category}".`,
          weightDeduction: 15,
          isAiAssisted: true
        });
      } else {
        findings.push({
          id: "finding_cat_ok",
          category: "Eligibility Category",
          field: "category",
          status: "PASS",
          title: "ST Category Confirmed",
          message: "ST certificate attached and category matches Scheduled Tribe requirement.",
          details: `Certificate number: ${stDoc.extractedData?.certificateNumber || appData.stCertNumber || "Verified"}.`,
          weightDeduction: 0,
          isAiAssisted: true
        });
      }
    }
    const appInst = appData.researchInstitution || appData.universityName || "";
    const admissionDoc = documents.find(
      (d) => d.docType === "admission_letter" || d.docType === "degree_certificate"
    );
    if (admissionDoc?.extractedData?.institution && appInst) {
      const docInst = admissionDoc.extractedData.institution;
      const sim = nameSimilarity(appInst, docInst);
      if (sim.score < 0.6) {
        institutionScore = 5;
        findings.push({
          id: "finding_inst_diff",
          category: "Academic/Institution",
          field: "institution",
          status: "WARNING",
          title: "Institution Name Requires Scrutiny",
          message: "Potential inconsistency detected. Manual verification required.",
          details: `Application lists institution as "${appInst}", while uploaded ${admissionDoc.title} indicates "${docInst}".`,
          weightDeduction: 10,
          isAiAssisted: true
        });
      } else {
        findings.push({
          id: "finding_inst_ok",
          category: "Academic/Institution",
          field: "institution",
          status: "PASS",
          title: "Institution Name Consistent",
          message: "Institution details on document match application entry.",
          details: `Institution verified: ${appInst}.`,
          weightDeduction: 0,
          isAiAssisted: true
        });
      }
    }
    const now = /* @__PURE__ */ new Date();
    for (const doc of documents) {
      if (doc.extractedData?.expiryDate) {
        const expDate = new Date(doc.extractedData.expiryDate);
        if (expDate.getTime() < now.getTime()) {
          validityScore = Math.max(0, validityScore - 10);
          findings.push({
            id: `finding_expired_${doc.id}`,
            category: "Document Validity",
            field: "expiryDate",
            status: "WARNING",
            title: `Expired Document Detected: ${doc.title}`,
            message: "Potential inconsistency detected. Manual verification required.",
            details: `${doc.title} expired on ${doc.extractedData.expiryDate}. Current valid certificate must be provided.`,
            weightDeduction: 10,
            isAiAssisted: true
          });
        } else {
          findings.push({
            id: `finding_valid_${doc.id}`,
            category: "Document Validity",
            field: "expiryDate",
            status: "PASS",
            title: `Certificate Valid: ${doc.title}`,
            message: `Document validity is active through ${doc.extractedData.expiryDate}.`,
            details: `Valid certificate.`,
            weightDeduction: 0,
            isAiAssisted: true
          });
        }
      }
    }
    const allApps = db.getApplications().filter((a) => a.id !== application.id);
    for (const other of allApps) {
      if (appData.stCertNumber && other.data?.stCertNumber && other.data.stCertNumber.trim() === appData.stCertNumber.trim()) {
        completenessScore = 0;
        hasHighSeverity = true;
        findings.push({
          id: "finding_duplicate_cert",
          category: "Integrity Check",
          field: "stCertNumber",
          status: "FAIL",
          title: "Duplicate Certificate Number Cross-Flag",
          message: "Potential inconsistency detected. Manual verification required.",
          details: `ST Certificate number "${appData.stCertNumber}" is also recorded under application ${other.applicationNumber}.`,
          weightDeduction: 10,
          isAiAssisted: true
        });
      }
    }
    for (const doc of documents) {
      if (doc.extractedData?.pageCount && doc.extractedData.pageCount < 2 && doc.docType === "research_proposal") {
        findings.push({
          id: `finding_pages_${doc.id}`,
          category: "Document Completeness",
          field: "pageCount",
          status: "WARNING",
          title: `Research Proposal Page Count Warning`,
          message: "Uploaded research proposal has only 1 page. Typical requirements expect complete synopsis.",
          details: `Extracted page count: 1. Manual scrutiny advised.`,
          weightDeduction: 5,
          isAiAssisted: true
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
    let riskLevel = "LOW";
    if (totalScore < 60 || hasHighSeverity) {
      riskLevel = "HIGH";
    } else if (totalScore < 85) {
      riskLevel = "MEDIUM";
    }
    const plainExplanation = `Automated document consistency evaluation calculated an overall score of ${totalScore}/100 with an advisory risk classification of ${riskLevel}. ${findings.filter((f) => f.status === "FAIL").length > 0 ? "High-priority discrepancies were flagged that require official verification before proceeding." : findings.filter((f) => f.status === "WARNING").length > 0 ? "Advisory warnings were noted regarding formatting or expiry dates for officer scrutiny." : "All cross-document identity, academic and tribal criteria show high alignment."}`;
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
        completeness: completenessScore
      },
      plainExplanation
    };
  }
};

// backend/ai/eligibilityEngine.ts
var EligibilityEngine = class {
  static evaluate(application, documents, rules) {
    const criteriaResults = [];
    const appData = application.data || {};
    let hasFail = false;
    let hasPending = false;
    let hasRequiresReview = false;
    for (const rule of rules) {
      let status = "PASS";
      let evidence = "";
      let conflictDetected = void 0;
      let fieldVal = void 0;
      let supportingDoc = void 0;
      if (rule.targetType === "document") {
        supportingDoc = documents.find((d) => d.docType === rule.targetKey || d.schemeDocId === rule.targetKey);
        if (rule.operator === "documentExists") {
          if (!supportingDoc) {
            status = rule.type === "required" ? "FAIL" : "REQUIRES_REVIEW";
            evidence = `Required document "${rule.targetKey}" is not uploaded.`;
            conflictDetected = "Missing mandatory supporting document.";
          } else {
            status = "PASS";
            evidence = `Document "${supportingDoc.title}" uploaded (${supportingDoc.fileStatus}).`;
          }
        } else if (rule.operator === "documentVerified") {
          if (!supportingDoc) {
            status = "FAIL";
            evidence = `Document "${rule.targetKey}" is not uploaded.`;
          } else if (supportingDoc.verificationStatus === "Verified") {
            status = "PASS";
            evidence = `Document "${supportingDoc.title}" verified by officer on ${supportingDoc.verifiedAt || "record"}.`;
          } else if (supportingDoc.verificationStatus === "Rejected") {
            status = "FAIL";
            evidence = `Document "${supportingDoc.title}" was marked Rejected by verification officer: ${supportingDoc.verificationRemarks || "Deficiency"}.`;
            conflictDetected = "Document verification rejected.";
          } else {
            status = "PENDING";
            evidence = `Document "${supportingDoc.title}" uploaded, official human verification is currently pending.`;
          }
        }
      } else {
        fieldVal = appData[rule.targetKey];
        if (fieldVal === void 0 || fieldVal === null) {
          if (rule.targetKey === "category") fieldVal = "ST";
          if (rule.targetKey === "annualIncome") fieldVal = appData.annualIncome;
        }
        if (fieldVal === void 0 || fieldVal === null || fieldVal === "") {
          status = rule.type === "required" ? "FAIL" : "PENDING";
          evidence = `Application field "${rule.targetKey}" is not specified.`;
          conflictDetected = "Mandatory field incomplete.";
        } else {
          switch (rule.operator) {
            case "equals":
              if (String(fieldVal).trim().toLowerCase() === String(rule.expectedValue).trim().toLowerCase()) {
                status = "PASS";
                evidence = `Field "${rule.targetKey}" value "${fieldVal}" satisfies requirement (${rule.expectedValue}).`;
              } else {
                status = "FAIL";
                evidence = `Field "${rule.targetKey}" value "${fieldVal}" does not match required value "${rule.expectedValue}".`;
                conflictDetected = `Mismatch in ${rule.targetKey}.`;
              }
              break;
            case "notEquals":
              if (String(fieldVal).trim().toLowerCase() !== String(rule.expectedValue).trim().toLowerCase()) {
                status = "PASS";
                evidence = `Field "${rule.targetKey}" satisfies requirement.`;
              } else {
                status = "FAIL";
                evidence = `Field "${rule.targetKey}" value matches prohibited value "${rule.expectedValue}".`;
              }
              break;
            case "greaterThanOrEqual":
              const numValGte = Number(fieldVal);
              const expValGte = Number(rule.expectedValue);
              if (!isNaN(numValGte) && numValGte >= expValGte) {
                status = "PASS";
                evidence = `Reported value ${numValGte} meets or exceeds minimum requirement of ${expValGte}.`;
              } else {
                status = "FAIL";
                evidence = `Reported value ${numValGte} is below required threshold of ${expValGte}.`;
                conflictDetected = `Threshold not met: ${numValGte} < ${expValGte}.`;
              }
              break;
            case "lessThanOrEqual":
              const numValLte = Number(fieldVal);
              const expValLte = Number(rule.expectedValue);
              if (!isNaN(numValLte) && numValLte <= expValLte) {
                status = "PASS";
                evidence = `Reported value \u20B9${numValLte.toLocaleString("en-IN")} is within maximum ceiling of \u20B9${expValLte.toLocaleString("en-IN")}.`;
              } else {
                status = "FAIL";
                evidence = `Reported value \u20B9${numValLte.toLocaleString("en-IN")} exceeds maximum allowed limit of \u20B9${expValLte.toLocaleString("en-IN")}.`;
                conflictDetected = `Income ceiling exceeded.`;
              }
              break;
            case "contains":
              if (Array.isArray(rule.expectedValue)) {
                const match = rule.expectedValue.some(
                  (v) => String(v).toLowerCase() === String(fieldVal).toLowerCase()
                );
                if (match) {
                  status = "PASS";
                  evidence = `Qualification "${fieldVal}" recognized under eligible degrees (${rule.expectedValue.join(", ")}).`;
                } else {
                  status = "FAIL";
                  evidence = `Qualification "${fieldVal}" is not in approved degrees: ${rule.expectedValue.join(", ")}.`;
                  conflictDetected = "Unapproved degree/course.";
                }
              } else if (String(fieldVal).toLowerCase().includes(String(rule.expectedValue).toLowerCase())) {
                status = "PASS";
                evidence = `Field "${rule.targetKey}" contains expected text "${rule.expectedValue}".`;
              } else {
                status = "FAIL";
                evidence = `Field "${rule.targetKey}" does not match required qualification.`;
              }
              break;
            default:
              status = "PASS";
              evidence = `Rule evaluated.`;
          }
        }
      }
      if (rule.type === "required") {
        if (status === "FAIL") hasFail = true;
        if (status === "PENDING") hasPending = true;
        if (status === "REQUIRES_REVIEW") hasRequiresReview = true;
      }
      const recommendedAction = status === "PASS" ? "Criteria fulfilled. No action needed." : status === "PENDING" ? "Await document scrutiny and officer verification." : status === "REQUIRES_REVIEW" ? "Officer review required to assess borderline or advisory condition." : rule.failMessage || "Candidate does not satisfy this eligibility condition.";
      criteriaResults.push({
        criterionId: rule.id,
        criterion: rule.criterion,
        type: rule.type,
        status,
        evidence,
        fieldUsed: rule.targetType === "field" ? rule.targetKey : void 0,
        supportingDocType: rule.targetType === "document" ? rule.targetKey : void 0,
        conflictDetected,
        recommendedAction
      });
    }
    let overallStatus = "Eligible";
    if (hasFail) {
      overallStatus = "Ineligible";
    } else if (hasRequiresReview) {
      overallStatus = "Requires review";
    } else if (hasPending) {
      overallStatus = "Eligible subject to pending verification";
    } else {
      overallStatus = "Eligible";
    }
    const passedCount = criteriaResults.filter((c) => c.status === "PASS").length;
    const totalCount = criteriaResults.length;
    const explanation = `Rule-based evaluation completed: ${passedCount} of ${totalCount} criteria satisfied. ${overallStatus === "Eligible" ? "The applicant satisfies all statutory conditions under the demo scheme configuration." : overallStatus === "Eligible subject to pending verification" ? "Core criteria are satisfied, subject to official human verification of uploaded documents." : overallStatus === "Ineligible" ? "One or more mandatory eligibility thresholds (such as marks, income ceiling or category) failed." : "One or more items require specialized manual review by the verification officer."}`;
    return {
      applicationId: application.id,
      overallStatus,
      criteriaResults,
      explanation,
      evaluatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};

// backend/database/seed.ts
async function runDatabaseSeed(forceReset = false) {
  const currentData = db.getData();
  if (!forceReset && currentData.users.length > 0) {
    return;
  }
  console.log("Seeding demo database for Tribal Scholarship Portal...");
  const uploadDir2 = path2.resolve(process.env.UPLOAD_DIR || "./uploads");
  if (!fs2.existsSync(uploadDir2)) {
    fs2.mkdirSync(uploadDir2, { recursive: true });
  }
  const sampleDocs = [
    { name: "sample_st_cert_matching.pdf", content: "DEMO ST CERTIFICATE: Name: Rahul Kumar, Tribe: Santhal, CertNo: ST/JH/2023/88492" },
    { name: "sample_st_cert_mismatch_name.pdf", content: "DEMO ST CERTIFICATE: Name: Rahul K., Tribe: Santhal, CertNo: ST/JH/2023/88492" },
    { name: "sample_st_cert_mismatch_dob.pdf", content: "DEMO ST CERTIFICATE: Name: Priya Munda, DOB: 1998-05-21, Tribe: Munda" },
    { name: "sample_income_cert_valid.pdf", content: "DEMO INCOME CERTIFICATE: Family Income: INR 320000/yr, Valid: 2024-2025" },
    { name: "sample_income_cert_expired.pdf", content: "DEMO INCOME CERTIFICATE: Family Income: INR 280000/yr, Expired: 2023-03-31" },
    { name: "sample_passport_valid.pdf", content: "DEMO PASSPORT: Name: Amit Tirkey, Passport No: Z4829104, Expiry: 2031-10-15" },
    { name: "sample_admission_letter.pdf", content: "DEMO ADMISSION LETTER: Enrolled in Ph.D. Programme in Tribal Linguistics, Delhi University" },
    { name: "sample_marksheet_pg.pdf", content: "DEMO POSTGRADUATE MARKSHEET: Overall Marks: 74.5% - First Class with Distinction" },
    { name: "sample_research_proposal.pdf", content: "DEMO RESEARCH PROPOSAL: Ethnobotanical knowledge systems among indigenous tribes of Eastern Ghats." }
  ];
  for (const s of sampleDocs) {
    const fPath = path2.join(uploadDir2, s.name);
    if (!fs2.existsSync(fPath)) {
      fs2.writeFileSync(fPath, s.content, "utf-8");
    }
  }
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync("Demo@123", salt);
  const users = [
    {
      id: "usr_applicant_0",
      email: "applicant@demo.com",
      passwordHash,
      role: "applicant",
      fullName: "Rahul Kumar Soren",
      mobile: "9876543210",
      active: true,
      createdAt: "2025-01-10T09:00:00.000Z"
    },
    {
      id: "usr_officer_0",
      email: "officer@demo.com",
      passwordHash,
      role: "officer",
      fullName: "Dr. Anita Meena",
      mobile: "9876543211",
      active: true,
      createdAt: "2025-01-05T09:00:00.000Z"
    },
    {
      id: "usr_selection_0",
      email: "selection@demo.com",
      passwordHash,
      role: "selection",
      fullName: "Shri Rajesh Gond",
      mobile: "9876543212",
      active: true,
      createdAt: "2025-01-05T09:00:00.000Z"
    },
    {
      id: "usr_admin_0",
      email: "admin@demo.com",
      passwordHash,
      role: "admin",
      fullName: "Super Administrator MoTA",
      mobile: "9876543213",
      active: true,
      createdAt: "2025-01-01T09:00:00.000Z"
    }
  ];
  const demoApplicantDetails = [
    { name: "Sunita Kerketta", email: "applicant1@demo.com", state: "Jharkhand", district: "Ranchi", income: 34e4, marks: 76.2 },
    { name: "Bikash Oraon", email: "applicant2@demo.com", state: "Odisha", district: "Mayurbhanj", income: 29e4, marks: 68.5 },
    { name: "Pooja Maravi", email: "applicant3@demo.com", state: "Madhya Pradesh", district: "Mandla", income: 42e4, marks: 71 },
    { name: "Kishan Munda", email: "applicant4@demo.com", state: "Jharkhand", district: "Khunti", income: 38e4, marks: 64 },
    { name: "Anjali Bhil", email: "applicant5@demo.com", state: "Rajasthan", district: "Udaipur", income: 31e4, marks: 79.5 },
    { name: "Lalit Rathwa", email: "applicant6@demo.com", state: "Gujarat", district: "Chhota Udaipur", income: 45e4, marks: 62 },
    { name: "Priya Nayak", email: "applicant7@demo.com", state: "Chhattisgarh", district: "Bastar", income: 26e4, marks: 81 },
    { name: "Deepak Gamit", email: "applicant8@demo.com", state: "Gujarat", district: "Tapi", income: 39e4, marks: 73.4 },
    { name: "Vikram Jamatia", email: "applicant9@demo.com", state: "Tripura", district: "Gomati", income: 85e4, marks: 54 },
    // Ineligible demo
    { name: "Kavita Deori", email: "applicant10@demo.com", state: "Assam", district: "Lakhimpur", income: 315e3, marks: 83.2 }
  ];
  const applicants = [
    {
      id: "app_prof_0",
      userId: "usr_applicant_0",
      fullName: "Rahul Kumar Soren",
      email: "applicant@demo.com",
      mobile: "9876543210",
      dob: "1998-05-12",
      gender: "Male",
      state: "Jharkhand",
      district: "Ranchi",
      category: "ST",
      stCertNumber: "ST/JH/2023/88492",
      stCertAuthority: "Sub-Divisional Officer, Ranchi",
      stCertDate: "2023-04-15",
      qualification: "Master's degree",
      annualIncome: 32e4,
      address: "Plot 42, Birsa Nagar, Kanke Road",
      pincode: "834008",
      bankName: "State Bank of India",
      accountNumber: "30987654321",
      ifscCode: "SBIN0001234",
      profileCompleted: true,
      updatedAt: "2025-01-12T10:00:00.000Z"
    }
  ];
  demoApplicantDetails.forEach((d, i) => {
    const uId = `usr_applicant_${i + 1}`;
    users.push({
      id: uId,
      email: d.email,
      passwordHash,
      role: "applicant",
      fullName: d.name,
      mobile: `98765432${20 + i}`,
      active: true,
      createdAt: "2025-01-10T09:00:00.000Z"
    });
    applicants.push({
      id: `app_prof_${i + 1}`,
      userId: uId,
      fullName: d.name,
      email: d.email,
      mobile: `98765432${20 + i}`,
      dob: "1997-08-19",
      gender: i % 2 === 0 ? "Female" : "Male",
      state: d.state,
      district: d.district,
      category: "ST",
      stCertNumber: `ST/${d.state.substr(0, 2).toUpperCase()}/2023/${7e4 + i}`,
      stCertAuthority: `Sub-Divisional Officer, ${d.district}`,
      stCertDate: "2023-05-10",
      qualification: "Master's degree",
      annualIncome: d.income,
      address: `Ward ${i + 1}, Tribal Colony, ${d.district}`,
      pincode: "450001",
      bankName: "Punjab National Bank",
      accountNumber: `209876543${10 + i}`,
      ifscCode: "PUNB0123400",
      profileCompleted: true,
      updatedAt: "2025-01-12T10:00:00.000Z"
    });
  });
  const schemes = [
    {
      id: "scheme_nfst",
      code: "NFST",
      name: "National Fellowship for Scheduled Tribe Students",
      fullName: "National Fellowship and Scholarship for Higher Education of ST Students (NFST)",
      description: "Fellowship for ST students pursuing M.Phil and Ph.D. degrees in Indian Universities and Research Institutions.",
      applicationStart: "2025-01-01",
      applicationEnd: "2025-11-30",
      active: true,
      totalSeats: 750,
      academicYear: "2025-26",
      formSections: [
        {
          key: "personal",
          title: "Personal Details",
          description: "Basic identity information of the applicant.",
          fields: [
            { key: "fullName", label: "Full Name (as in certificates)", type: "text", required: true },
            { key: "fatherName", label: "Father's / Guardian's Name", type: "text", required: true },
            { key: "dob", label: "Date of Birth", type: "date", required: true },
            { key: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"], required: true }
          ]
        },
        {
          key: "category",
          title: "Tribal / Category Information",
          description: "Scheduled Tribe credentials and issuing details.",
          fields: [
            { key: "category", label: "Category", type: "select", options: ["ST"], required: true },
            { key: "subTribe", label: "Sub-Tribe / Community Name", type: "text", required: true },
            { key: "stCertNumber", label: "ST Certificate Number", type: "text", required: true },
            { key: "stCertAuthority", label: "Issuing Authority", type: "text", required: true },
            { key: "stCertDate", label: "Date of Certificate Issue", type: "date", required: true }
          ]
        },
        {
          key: "education",
          title: "Educational Qualifications",
          description: "Postgraduate and graduate degree scores.",
          fields: [
            { key: "highestQualification", label: "Highest Qualification Attained", type: "select", options: ["Master's degree", "M.Phil", "Bachelor's degree"], required: true },
            { key: "postgraduateDegree", label: "Postgraduate Degree Title", type: "text", required: true },
            { key: "postgraduatePercentage", label: "Postgraduate Aggregate Percentage (%)", type: "number", required: true },
            { key: "ugDegree", label: "Undergraduate Degree", type: "text", required: true },
            { key: "ugPercentage", label: "UG Marks Percentage (%)", type: "number", required: true }
          ]
        },
        {
          key: "research",
          title: "Research Programme & Institution",
          description: "Enrolment in Ph.D. or M.Phil in India.",
          fields: [
            { key: "enrolledInResearch", label: "Are you enrolled in M.Phil / Ph.D. in an Indian University?", type: "select", options: ["yes", "no"], required: true },
            { key: "researchInstitution", label: "University / Institute Name", type: "text", required: true },
            { key: "researchDepartment", label: "Department / Faculty", type: "text", required: true },
            { key: "researchTopic", label: "Title / Subject of Research Thesis", type: "textarea", required: true },
            { key: "enrolmentDate", label: "Admission / Enrolment Date", type: "date", required: true }
          ]
        },
        {
          key: "financial",
          title: "Income and Financial Details",
          description: "Annual family income from all sources.",
          fields: [
            { key: "annualIncome", label: "Total Annual Family Income (INR)", type: "number", required: true },
            { key: "incomeCertNumber", label: "Income Certificate Number", type: "text", required: true },
            { key: "incomeCertIssueDate", label: "Income Certificate Issue Date", type: "date", required: true }
          ]
        },
        {
          key: "bank",
          title: "Bank Account for Direct Benefit Transfer",
          description: "Aadhaar-seeded bank account for scholarship disbursements.",
          fields: [
            { key: "bankName", label: "Bank Name", type: "text", required: true },
            { key: "accountNumber", label: "Account Number", type: "text", required: true },
            { key: "ifscCode", label: "IFSC Code", type: "text", required: true }
          ]
        },
        {
          key: "declaration",
          title: "Applicant Declaration",
          description: "Statutory acknowledgement.",
          fields: [
            { key: "agreedTerms", label: "I declare all information and certificates provided are authentic and truthful.", type: "checkbox", required: true }
          ]
        }
      ],
      requiredDocuments: [
        { id: "req_st_cert", code: "st_certificate", title: "Scheduled Tribe (ST) Certificate", description: "Competent revenue authority issued ST certificate", mandatory: true, allowedFormats: ["application/pdf", "image/jpeg", "image/png"], maxSizeMB: 5 },
        { id: "req_income_cert", code: "income_certificate", title: "Annual Family Income Certificate", description: "Current valid income certificate issued by Tahsildar/SDO", mandatory: true, allowedFormats: ["application/pdf", "image/jpeg", "image/png"], maxSizeMB: 5 },
        { id: "req_admission_letter", code: "admission_letter", title: "Ph.D. / M.Phil Admission or Enrolment Letter", description: "Official letter from University Registrar or Dean", mandatory: true, allowedFormats: ["application/pdf", "image/jpeg", "image/png"], maxSizeMB: 5 },
        { id: "req_degree_cert", code: "degree_certificate", title: "Postgraduate Degree Certificate / Marksheets", description: "Consolidated marksheet or convocation degree", mandatory: true, allowedFormats: ["application/pdf", "image/jpeg", "image/png"], maxSizeMB: 5 },
        { id: "req_research_proposal", code: "research_proposal", title: "Research Proposal / Synopsis", description: "Synopsis signed by research guide/supervisor", mandatory: true, allowedFormats: ["application/pdf"], maxSizeMB: 5 },
        { id: "req_bank_passbook", code: "bank_passbook", title: "Bank Passbook / Cancelled Cheque", description: "Showing Account number, IFSC and Name", mandatory: false, allowedFormats: ["application/pdf", "image/jpeg"], maxSizeMB: 5 }
      ],
      eligibilityRules: [
        { id: "rule_nfst_cat", criterion: "Candidate must belong to Scheduled Tribe (ST) community", type: "required", targetType: "field", targetKey: "category", operator: "equals", expectedValue: "ST", weight: 20, failMessage: "Only candidates from Scheduled Tribe community are eligible for NFST.", evidenceSource: "ST Certificate" },
        { id: "rule_nfst_qual", criterion: "Candidate must possess Master's degree or M.Phil", type: "required", targetType: "field", targetKey: "highestQualification", operator: "contains", expectedValue: ["Master's degree", "M.Phil"], weight: 20, failMessage: "Must possess Master's degree or M.Phil.", evidenceSource: "Degree Certificate" },
        { id: "rule_nfst_marks", criterion: "Minimum 55% marks in Postgraduate degree", type: "required", targetType: "field", targetKey: "postgraduatePercentage", operator: "greaterThanOrEqual", expectedValue: 55, weight: 20, failMessage: "Minimum postgraduate score required is 55.0%.", evidenceSource: "Postgraduate Marksheet" },
        { id: "rule_nfst_income", criterion: "Annual family income must not exceed INR 6,00,000", type: "required", targetType: "field", targetKey: "annualIncome", operator: "lessThanOrEqual", expectedValue: 6e5, weight: 15, failMessage: "Family income exceeds ceiling of \u20B96,00,000.", evidenceSource: "Income Certificate" },
        { id: "rule_nfst_enrolled", criterion: "Must be actively enrolled in Ph.D. or M.Phil in India", type: "required", targetType: "field", targetKey: "enrolledInResearch", operator: "equals", expectedValue: "yes", weight: 15, failMessage: "Candidate must have confirmed enrolment in research programme.", evidenceSource: "Admission Letter" },
        { id: "rule_nfst_doc_st", criterion: "Scheduled Tribe certificate uploaded and verified", type: "required", targetType: "document", targetKey: "st_certificate", operator: "documentVerified", expectedValue: true, weight: 10, failMessage: "ST certificate requires officer verification.", evidenceSource: "Uploaded ST Document" }
      ],
      selectionCriteria: [
        { id: "crit_acad", code: "ACAD", label: "Academic Merit (PG Marks)", description: "Postgraduate percentage scaled to 40 points", weight: 40, sourceType: "academic" },
        { id: "crit_relevance", code: "RESEARCH", label: "Research Proposal Relevance", description: "Relevance to tribal development, linguistics, indigenous sciences", weight: 30, sourceType: "research" },
        { id: "crit_doc_verif", code: "VERIF", label: "Document Completeness & Verification", description: "Verification completeness of all statutory certificates", weight: 20, sourceType: "verification" },
        { id: "crit_consistency", code: "CONSISTENCY", label: "Consistency & Integrity Assurance", description: "Bonus score based on automated document cross-checks", weight: 10, sourceType: "risk_penalty" }
      ],
      workflowStages: [
        { id: "stg_1", order: 1, code: "SUBMITTED", name: "Application Submitted", description: "Application filed and initial sanity checks completed", assignedRole: "applicant" },
        { id: "stg_2", order: 2, code: "DOC_VERIF", name: "Document Verification", description: "Scrutiny of original documents and OCR data by Verification Officer", assignedRole: "officer" },
        { id: "stg_3", order: 3, code: "ELIG_EVAL", name: "Eligibility Review", description: "Automated rule engine evaluation and officer sign-off", assignedRole: "officer" },
        { id: "stg_4", order: 4, code: "SCREENING", name: "Merit Screening", description: "Ranking and score computation based on selection criteria", assignedRole: "selection" },
        { id: "stg_5", order: 5, code: "FINAL_DECISION", name: "Final Selection", description: "Final award decision and selection list publication", assignedRole: "selection" },
        { id: "stg_6", order: 6, code: "POST_SELECTION", name: "Post-Selection Monitoring", description: "Joining reports, progress submissions and fellowship continuations", assignedRole: "officer" }
      ]
    },
    {
      id: "scheme_nos",
      code: "NOS",
      name: "National Overseas Scholarship for ST Students",
      fullName: "National Overseas Scholarship for Higher Studies Abroad for Scheduled Tribe Candidates",
      description: "Scholarship support for ST students to pursue Master level courses and Ph.D. abroad in prestigious global universities.",
      applicationStart: "2025-01-01",
      applicationEnd: "2025-11-30",
      active: true,
      totalSeats: 100,
      academicYear: "2025-26",
      formSections: [
        {
          key: "personal",
          title: "Personal & Passport Details",
          description: "Identity details and passport validity.",
          fields: [
            { key: "fullName", label: "Full Name as per Passport", type: "text", required: true },
            { key: "dob", label: "Date of Birth", type: "date", required: true },
            { key: "age", label: "Age (as on cutoff date)", type: "number", required: true },
            { key: "passportNumber", label: "Passport Number", type: "text", required: true },
            { key: "passportExpiry", label: "Passport Expiry Date", type: "date", required: true }
          ]
        },
        {
          key: "category",
          title: "Category Details",
          fields: [
            { key: "category", label: "Category", type: "select", options: ["ST"], required: true },
            { key: "stCertNumber", label: "ST Certificate Number", type: "text", required: true }
          ]
        },
        {
          key: "foreign_admission",
          title: "Foreign University Admission Details",
          description: "Details of unconditional offer from recognized foreign university.",
          fields: [
            { key: "foreignOffer", label: "Do you hold an admission offer from a foreign university?", type: "select", options: ["yes", "no"], required: true },
            { key: "foreignUniversity", label: "Foreign University Name", type: "text", required: true },
            { key: "foreignCountry", label: "Country of Study", type: "text", required: true },
            { key: "degreeAbroad", label: "Degree to be Pursued", type: "select", options: ["Master's", "Ph.D."], required: true },
            { key: "qsRanking", label: "University QS World Ranking (approx)", type: "number", required: true }
          ]
        },
        {
          key: "education",
          title: "Previous Qualifying Degree",
          fields: [
            { key: "qualifyingDegree", label: "Qualifying Degree Completed", type: "select", options: ["Bachelor's degree", "Master's degree"], required: true },
            { key: "marksPercentage", label: "Qualifying Examination Percentage (%)", type: "number", required: true }
          ]
        },
        {
          key: "financial",
          title: "Family Financial Details",
          fields: [
            { key: "annualIncome", label: "Total Annual Family Income (INR)", type: "number", required: true }
          ]
        },
        {
          key: "declaration",
          title: "Statutory Declaration",
          fields: [
            { key: "agreedTerms", label: "I confirm willingness to serve in India after completion of studies.", type: "checkbox", required: true }
          ]
        }
      ],
      requiredDocuments: [
        { id: "req_nos_st", code: "st_certificate", title: "Scheduled Tribe Certificate", description: "Certified ST status document", mandatory: true, allowedFormats: ["application/pdf", "image/jpeg"], maxSizeMB: 5 },
        { id: "req_nos_income", code: "income_certificate", title: "Income Certificate", description: "Current valid family income certificate", mandatory: true, allowedFormats: ["application/pdf", "image/jpeg"], maxSizeMB: 5 },
        { id: "req_nos_passport", code: "passport", title: "Valid Indian Passport", description: "Scanned copy of bio-data and address pages", mandatory: true, allowedFormats: ["application/pdf"], maxSizeMB: 5 },
        { id: "req_nos_offer", code: "admission_letter", title: "Unconditional Admission Offer Letter", description: "Official offer letter from overseas institution", mandatory: true, allowedFormats: ["application/pdf"], maxSizeMB: 5 },
        { id: "req_nos_degree", code: "degree_certificate", title: "Qualifying Degree Certificate & Transcripts", description: "Complete transcripts with GPA/percentage", mandatory: true, allowedFormats: ["application/pdf"], maxSizeMB: 5 }
      ],
      eligibilityRules: [
        { id: "rule_nos_cat", criterion: "Must belong to Scheduled Tribe (ST)", type: "required", targetType: "field", targetKey: "category", operator: "equals", expectedValue: "ST", weight: 20, failMessage: "ST category mandatory for NOS.", evidenceSource: "ST Certificate" },
        { id: "rule_nos_age", criterion: "Age must not exceed 35 years as on cutoff date", type: "required", targetType: "field", targetKey: "age", operator: "lessThanOrEqual", expectedValue: 35, weight: 20, failMessage: "Age exceeds the permissible cutoff limit of 35 years.", evidenceSource: "Passport / Birth Certificate" },
        { id: "rule_nos_marks", criterion: "Minimum 60% marks in qualifying degree", type: "required", targetType: "field", targetKey: "marksPercentage", operator: "greaterThanOrEqual", expectedValue: 60, weight: 20, failMessage: "Minimum qualifying mark required for NOS is 60.0%.", evidenceSource: "Degree Transcripts" },
        { id: "rule_nos_income", criterion: "Family income must not exceed INR 6,00,000 per annum", type: "required", targetType: "field", targetKey: "annualIncome", operator: "lessThanOrEqual", expectedValue: 6e5, weight: 20, failMessage: "Income exceeds ceiling of \u20B96,00,000.", evidenceSource: "Income Certificate" },
        { id: "rule_nos_offer", criterion: "Must have confirmed admission offer from overseas university", type: "required", targetType: "field", targetKey: "foreignOffer", operator: "equals", expectedValue: "yes", weight: 20, failMessage: "Must possess confirmed admission offer letter.", evidenceSource: "Offer Letter" }
      ],
      selectionCriteria: [
        { id: "crit_nos_ranking", code: "QS_RANK", label: "University QS Ranking Tier", description: "Tier 1 (1-200): 40pts, Tier 2 (201-500): 30pts", weight: 40, sourceType: "academic" },
        { id: "crit_nos_marks", code: "MARKS", label: "Undergraduate/PG Transcripts Score", description: "Percentage scaled to 30 points", weight: 30, sourceType: "academic" },
        { id: "crit_nos_verif", code: "VERIF", label: "Document Verification Completeness", description: "All verified documents without deficiency", weight: 20, sourceType: "verification" },
        { id: "crit_nos_integrity", code: "INTEG", label: "Consistency & Integrity Assurance", description: "Document alignment bonus", weight: 10, sourceType: "risk_penalty" }
      ],
      workflowStages: [
        { id: "nos_stg_1", order: 1, code: "SUBMITTED", name: "Application Submitted", description: "Application filed", assignedRole: "applicant" },
        { id: "nos_stg_2", order: 2, code: "DOC_VERIF", name: "Document Verification", description: "Passport and overseas offer verification", assignedRole: "officer" },
        { id: "nos_stg_3", order: 3, code: "ELIG_EVAL", name: "Eligibility Review", description: "Age and income threshold validation", assignedRole: "officer" },
        { id: "nos_stg_4", order: 4, code: "SCREENING", name: "Merit Screening", description: "QS ranking and merit evaluation", assignedRole: "selection" },
        { id: "nos_stg_5", order: 5, code: "FINAL_DECISION", name: "Final Selection", description: "Provisional award notification", assignedRole: "selection" },
        { id: "nos_stg_6", order: 6, code: "POST_SELECTION", name: "Post-Selection Monitoring", description: "Visa clearance and university enrollment letter", assignedRole: "officer" }
      ]
    }
  ];
  const applications = [
    // 1. Fully eligible (NFST), high consistency 96% LOW risk, verified, ready for screening
    {
      id: "app_1",
      applicationNumber: "NFST-2025-001",
      schemeId: "scheme_nfst",
      applicantId: "app_prof_0",
      applicantName: "Rahul Kumar Soren",
      applicantEmail: "applicant@demo.com",
      status: "Eligible",
      currentStage: "ELIG_EVAL",
      createdAt: "2025-01-15T08:30:00.000Z",
      submittedAt: "2025-01-16T10:15:00.000Z",
      lastUpdatedAt: "2025-01-20T14:00:00.000Z",
      consistencyScore: 96,
      riskLevel: "LOW",
      eligibilityStatus: "Eligible",
      data: {
        fullName: "Rahul Kumar Soren",
        fatherName: "Ramesh Kumar Soren",
        dob: "1998-05-12",
        gender: "Male",
        category: "ST",
        subTribe: "Santhal",
        stCertNumber: "ST/JH/2023/88492",
        stCertAuthority: "Sub-Divisional Officer, Ranchi",
        stCertDate: "2023-04-15",
        highestQualification: "Master's degree",
        postgraduateDegree: "M.Sc. in Anthropology",
        postgraduatePercentage: 74.5,
        ugDegree: "B.Sc. Anthropology",
        ugPercentage: 71,
        enrolledInResearch: "yes",
        researchInstitution: "Delhi University",
        researchDepartment: "Department of Anthropology",
        researchTopic: "Ethnobotanical Traditions of Santhal Community in Chota Nagpur Plateau",
        enrolmentDate: "2024-08-01",
        annualIncome: 32e4,
        incomeCertNumber: "INC/2024/77481",
        incomeCertIssueDate: "2024-05-10",
        bankName: "State Bank of India",
        accountNumber: "30987654321",
        ifscCode: "SBIN0001234",
        agreedTerms: true
      }
    },
    // 2. Missing document (NOS: passport missing) with deficiency raised
    {
      id: "app_2",
      applicationNumber: "NOS-2025-002",
      schemeId: "scheme_nos",
      applicantId: "app_prof_1",
      applicantName: "Sunita Kerketta",
      applicantEmail: "applicant1@demo.com",
      status: "Deficient",
      currentStage: "DOC_VERIF",
      createdAt: "2025-01-18T09:00:00.000Z",
      submittedAt: "2025-01-19T11:00:00.000Z",
      lastUpdatedAt: "2025-01-22T16:00:00.000Z",
      consistencyScore: 78,
      riskLevel: "MEDIUM",
      eligibilityStatus: "Requires review",
      data: {
        fullName: "Sunita Kerketta",
        dob: "1997-08-19",
        age: 27,
        passportNumber: "Z1948201",
        passportExpiry: "2032-04-10",
        category: "ST",
        stCertNumber: "ST/JH/2023/70000",
        foreignOffer: "yes",
        foreignUniversity: "University of Edinburgh",
        foreignCountry: "United Kingdom",
        degreeAbroad: "Master's",
        qsRanking: 27,
        qualifyingDegree: "Bachelor's degree",
        marksPercentage: 76.2,
        annualIncome: 34e4,
        agreedTerms: true
      }
    },
    // 3. Name mismatch ("Rahul K." vs "Rahul Kumar"), MEDIUM risk
    {
      id: "app_3",
      applicationNumber: "NFST-2025-003",
      schemeId: "scheme_nfst",
      applicantId: "app_prof_2",
      applicantName: "Bikash Oraon",
      applicantEmail: "applicant2@demo.com",
      status: "Under Verification",
      currentStage: "DOC_VERIF",
      createdAt: "2025-01-20T10:00:00.000Z",
      submittedAt: "2025-01-21T12:00:00.000Z",
      lastUpdatedAt: "2025-01-23T11:00:00.000Z",
      consistencyScore: 72,
      riskLevel: "MEDIUM",
      eligibilityStatus: "Eligible subject to pending verification",
      data: {
        fullName: "Bikash Oraon",
        fatherName: "Mangal Oraon",
        dob: "1997-03-25",
        gender: "Male",
        category: "ST",
        subTribe: "Oraon",
        stCertNumber: "ST/OD/2023/70001",
        stCertAuthority: "Tahsildar, Mayurbhanj",
        stCertDate: "2023-03-12",
        highestQualification: "Master's degree",
        postgraduateDegree: "M.A. in Tribal Economics",
        postgraduatePercentage: 68.5,
        ugDegree: "B.A. Economics",
        ugPercentage: 65,
        enrolledInResearch: "yes",
        researchInstitution: "Utkal University",
        researchDepartment: "P.G. Department of Economics",
        researchTopic: "Microfinance Impact on Tribal Livelihoods in Northern Odisha",
        enrolmentDate: "2024-07-15",
        annualIncome: 29e4,
        incomeCertNumber: "INC/OD/2024/3819",
        incomeCertIssueDate: "2024-04-10",
        bankName: "UCO Bank",
        accountNumber: "19876543210",
        ifscCode: "UCBA0000123",
        agreedTerms: true
      }
    },
    // 4. DOB mismatch, HIGH risk (1998-05-12 vs 1998-05-21)
    {
      id: "app_4",
      applicationNumber: "NOS-2025-004",
      schemeId: "scheme_nos",
      applicantId: "app_prof_3",
      applicantName: "Pooja Maravi",
      applicantEmail: "applicant3@demo.com",
      status: "Under Verification",
      currentStage: "DOC_VERIF",
      createdAt: "2025-01-22T08:00:00.000Z",
      submittedAt: "2025-01-23T09:30:00.000Z",
      lastUpdatedAt: "2025-01-24T15:00:00.000Z",
      consistencyScore: 58,
      riskLevel: "HIGH",
      eligibilityStatus: "Requires review",
      data: {
        fullName: "Pooja Maravi",
        dob: "1998-05-12",
        age: 26,
        passportNumber: "Z8941029",
        passportExpiry: "2030-08-14",
        category: "ST",
        stCertNumber: "ST/MP/2023/70002",
        foreignOffer: "yes",
        foreignUniversity: "Australian National University",
        foreignCountry: "Australia",
        degreeAbroad: "Master's",
        qsRanking: 34,
        qualifyingDegree: "Bachelor's degree",
        marksPercentage: 71,
        annualIncome: 42e4,
        agreedTerms: true
      }
    },
    // 5. Expired document (income cert expired)
    {
      id: "app_5",
      applicationNumber: "NFST-2025-005",
      schemeId: "scheme_nfst",
      applicantId: "app_prof_4",
      applicantName: "Kishan Munda",
      applicantEmail: "applicant4@demo.com",
      status: "Deficient",
      currentStage: "DOC_VERIF",
      createdAt: "2025-01-23T11:00:00.000Z",
      submittedAt: "2025-01-24T14:20:00.000Z",
      lastUpdatedAt: "2025-01-26T10:00:00.000Z",
      consistencyScore: 66,
      riskLevel: "MEDIUM",
      eligibilityStatus: "Eligible subject to pending verification",
      data: {
        fullName: "Kishan Munda",
        fatherName: "Birsa Munda",
        dob: "1996-11-04",
        gender: "Male",
        category: "ST",
        subTribe: "Munda",
        stCertNumber: "ST/JH/2023/70003",
        stCertAuthority: "Sub-Divisional Officer, Khunti",
        stCertDate: "2023-01-18",
        highestQualification: "Master's degree",
        postgraduateDegree: "M.Sc. in Forestry",
        postgraduatePercentage: 64,
        ugDegree: "B.Sc. Botany",
        ugPercentage: 61.5,
        enrolledInResearch: "yes",
        researchInstitution: "Birsa Agricultural University",
        researchDepartment: "Faculty of Forestry",
        researchTopic: "Conservation of Non-Timber Forest Produce by Munda Tribals",
        enrolmentDate: "2024-09-01",
        annualIncome: 38e4,
        incomeCertNumber: "INC/JH/2022/9012",
        incomeCertIssueDate: "2022-04-10",
        // Expired
        bankName: "Bank of India",
        accountNumber: "49876543210",
        ifscCode: "BKID0004987",
        agreedTerms: true
      }
    },
    // 6. Pending verification (submitted, nothing verified)
    {
      id: "app_6",
      applicationNumber: "NFST-2025-006",
      schemeId: "scheme_nfst",
      applicantId: "app_prof_5",
      applicantName: "Anjali Bhil",
      applicantEmail: "applicant5@demo.com",
      status: "Submitted",
      currentStage: "SUBMITTED",
      createdAt: "2025-01-25T14:00:00.000Z",
      submittedAt: "2025-01-25T16:00:00.000Z",
      lastUpdatedAt: "2025-01-25T16:00:00.000Z",
      consistencyScore: 92,
      riskLevel: "LOW",
      eligibilityStatus: "Eligible subject to pending verification",
      data: {
        fullName: "Anjali Bhil",
        fatherName: "Devendra Bhil",
        dob: "1997-04-15",
        gender: "Female",
        category: "ST",
        subTribe: "Bhil",
        stCertNumber: "ST/RJ/2023/70004",
        stCertAuthority: "Sub-Divisional Magistrate, Udaipur",
        stCertDate: "2023-06-20",
        highestQualification: "Master's degree",
        postgraduateDegree: "M.A. in History",
        postgraduatePercentage: 79.5,
        ugDegree: "B.A. History",
        ugPercentage: 77,
        enrolledInResearch: "yes",
        researchInstitution: "Mohanlal Sukhadia University",
        researchDepartment: "Department of History",
        researchTopic: "Bhil Resistance Movements During Pre-Independence Era",
        enrolmentDate: "2024-08-10",
        annualIncome: 31e4,
        incomeCertNumber: "INC/RJ/2024/5521",
        incomeCertIssueDate: "2024-05-15",
        bankName: "Bank of Baroda",
        accountNumber: "58765432109",
        ifscCode: "BARB0UDAIPU",
        agreedTerms: true
      }
    },
    // 7. High consistency NOS (93% score, LOW risk)
    {
      id: "app_7",
      applicationNumber: "NOS-2025-007",
      schemeId: "scheme_nos",
      applicantId: "app_prof_6",
      applicantName: "Lalit Rathwa",
      applicantEmail: "applicant6@demo.com",
      status: "Eligible",
      currentStage: "ELIG_EVAL",
      createdAt: "2025-01-24T10:00:00.000Z",
      submittedAt: "2025-01-25T11:30:00.000Z",
      lastUpdatedAt: "2025-01-26T14:00:00.000Z",
      consistencyScore: 93,
      riskLevel: "LOW",
      eligibilityStatus: "Eligible",
      data: {
        fullName: "Lalit Rathwa",
        dob: "1998-02-10",
        age: 26,
        passportNumber: "Z3910485",
        passportExpiry: "2033-01-20",
        category: "ST",
        stCertNumber: "ST/GJ/2023/70005",
        foreignOffer: "yes",
        foreignUniversity: "University of British Columbia",
        foreignCountry: "Canada",
        degreeAbroad: "Master's",
        qsRanking: 38,
        qualifyingDegree: "Bachelor's degree",
        marksPercentage: 62,
        annualIncome: 45e4,
        agreedTerms: true
      }
    },
    // 8. Medium risk (score 68%)
    {
      id: "app_8",
      applicationNumber: "NFST-2025-008",
      schemeId: "scheme_nfst",
      applicantId: "app_prof_7",
      applicantName: "Priya Nayak",
      applicantEmail: "applicant7@demo.com",
      status: "Under Verification",
      currentStage: "DOC_VERIF",
      createdAt: "2025-01-26T09:00:00.000Z",
      submittedAt: "2025-01-26T12:00:00.000Z",
      lastUpdatedAt: "2025-01-27T10:00:00.000Z",
      consistencyScore: 68,
      riskLevel: "MEDIUM",
      eligibilityStatus: "Eligible subject to pending verification",
      data: {
        fullName: "Priya Nayak",
        fatherName: "Somaru Nayak",
        dob: "1999-01-12",
        gender: "Female",
        category: "ST",
        subTribe: "Gond",
        stCertNumber: "ST/CG/2023/70006",
        stCertAuthority: "Collector Office, Bastar",
        stCertDate: "2023-07-15",
        highestQualification: "Master's degree",
        postgraduateDegree: "M.Sc. in Rural Technology",
        postgraduatePercentage: 81,
        ugDegree: "B.Sc. Agriculture",
        ugPercentage: 78.5,
        enrolledInResearch: "yes",
        researchInstitution: "Bastar Vishwavidyalaya",
        researchDepartment: "Department of Forestry and Wildlife",
        researchTopic: "Indigenous Agro-Ecological Farming Practices in Bastar District",
        enrolmentDate: "2024-08-20",
        annualIncome: 26e4,
        incomeCertNumber: "INC/CG/2024/1109",
        incomeCertIssueDate: "2024-04-18",
        bankName: "State Bank of India",
        accountNumber: "68765432109",
        ifscCode: "SBIN0006789",
        agreedTerms: true
      }
    },
    // 9. Ineligible (NOS: income above limit ₹8,50,000, marks 54% < 60%, age 37 > 35)
    {
      id: "app_9",
      applicationNumber: "NOS-2025-009",
      schemeId: "scheme_nos",
      applicantId: "app_prof_8",
      applicantName: "Vikram Jamatia",
      applicantEmail: "applicant9@demo.com",
      status: "Ineligible",
      currentStage: "ELIG_EVAL",
      createdAt: "2025-01-20T10:00:00.000Z",
      submittedAt: "2025-01-21T11:00:00.000Z",
      lastUpdatedAt: "2025-01-25T15:00:00.000Z",
      consistencyScore: 84,
      riskLevel: "LOW",
      eligibilityStatus: "Ineligible",
      data: {
        fullName: "Vikram Jamatia",
        dob: "1987-03-14",
        age: 37,
        // Exceeds 35
        passportNumber: "Z1029481",
        passportExpiry: "2029-06-12",
        category: "ST",
        stCertNumber: "ST/TR/2023/70008",
        foreignOffer: "yes",
        foreignUniversity: "University of Sydney",
        foreignCountry: "Australia",
        degreeAbroad: "Master's",
        qsRanking: 19,
        qualifyingDegree: "Bachelor's degree",
        marksPercentage: 54,
        // Below 60%
        annualIncome: 85e4,
        // Exceeds ₹6,00,000
        agreedTerms: true
      }
    },
    // 10. Shortlisted candidate with screening score 88.5
    {
      id: "app_10",
      applicationNumber: "NFST-2025-010",
      schemeId: "scheme_nfst",
      applicantId: "app_prof_9",
      applicantName: "Kavita Deori",
      applicantEmail: "applicant10@demo.com",
      status: "Shortlisted",
      currentStage: "SCREENING",
      createdAt: "2025-01-14T09:00:00.000Z",
      submittedAt: "2025-01-15T10:00:00.000Z",
      lastUpdatedAt: "2025-01-26T17:00:00.000Z",
      consistencyScore: 97,
      riskLevel: "LOW",
      eligibilityStatus: "Eligible",
      screeningScore: 88.5,
      officerDecision: "Shortlist",
      officerRemarks: "Candidate exhibits high academic distinction in Botany with research proposal directly aligned with traditional medicinal knowledge preservation.",
      data: {
        fullName: "Kavita Deori",
        fatherName: "Biren Deori",
        dob: "1996-09-08",
        gender: "Female",
        category: "ST",
        subTribe: "Deori",
        stCertNumber: "ST/AS/2023/70009",
        stCertAuthority: "Deputy Commissioner, Lakhimpur",
        stCertDate: "2023-02-14",
        highestQualification: "Master's degree",
        postgraduateDegree: "M.Sc. in Botany",
        postgraduatePercentage: 83.2,
        ugDegree: "B.Sc. Botany",
        ugPercentage: 80,
        enrolledInResearch: "yes",
        researchInstitution: "Gauhati University",
        researchDepartment: "Department of Botany",
        researchTopic: "Phytochemical and Molecular Characterization of Endangered Medicinal Plants in Eastern Himalayas",
        enrolmentDate: "2024-07-20",
        annualIncome: 315e3,
        incomeCertNumber: "INC/AS/2024/7710",
        incomeCertIssueDate: "2024-03-25",
        bankName: "State Bank of India",
        accountNumber: "78765432109",
        ifscCode: "SBIN0004567",
        agreedTerms: true
      }
    },
    // 11. Finalized "Selected" candidate in Post-Selection with fellowship award
    {
      id: "app_11",
      applicationNumber: "NFST-2025-011",
      schemeId: "scheme_nfst",
      applicantId: "app_prof_0",
      // linked to primary demo applicant
      applicantName: "Rahul Kumar Soren",
      applicantEmail: "applicant@demo.com",
      status: "Selected",
      currentStage: "POST_SELECTION",
      createdAt: "2024-11-10T09:00:00.000Z",
      submittedAt: "2024-11-15T10:00:00.000Z",
      lastUpdatedAt: "2025-01-28T14:00:00.000Z",
      consistencyScore: 98,
      riskLevel: "LOW",
      eligibilityStatus: "Eligible",
      screeningScore: 91,
      officerDecision: "Select",
      officerRemarks: "Selected under regular Ph.D. fellowship quota. Sanction issued.",
      finalizedAt: "2025-01-10T12:00:00.000Z",
      postSelectionStatus: "Active Fellow",
      data: {
        fullName: "Rahul Kumar Soren",
        fatherName: "Ramesh Kumar Soren",
        dob: "1998-05-12",
        gender: "Male",
        category: "ST",
        subTribe: "Santhal",
        stCertNumber: "ST/JH/2023/88492",
        stCertAuthority: "Sub-Divisional Officer, Ranchi",
        stCertDate: "2023-04-15",
        highestQualification: "Master's degree",
        postgraduateDegree: "M.Sc. in Anthropology",
        postgraduatePercentage: 74.5,
        ugDegree: "B.Sc. Anthropology",
        ugPercentage: 71,
        enrolledInResearch: "yes",
        researchInstitution: "Delhi University",
        researchDepartment: "Department of Anthropology",
        researchTopic: "Ethnobotanical Traditions of Santhal Community in Chota Nagpur Plateau",
        enrolmentDate: "2024-08-01",
        annualIncome: 32e4,
        incomeCertNumber: "INC/2024/77481",
        incomeCertIssueDate: "2024-05-10",
        bankName: "State Bank of India",
        accountNumber: "30987654321",
        ifscCode: "SBIN0001234",
        agreedTerms: true
      }
    }
  ];
  const documents = [];
  documents.push(
    {
      id: "doc_1_st",
      applicationId: "app_1",
      schemeDocId: "req_st_cert",
      docType: "st_certificate",
      title: "Scheduled Tribe (ST) Certificate",
      fileName: "sample_st_cert_matching.pdf",
      originalFileName: "st_certificate_rahul.pdf",
      filePath: path2.join(uploadDir2, "sample_st_cert_matching.pdf"),
      fileSize: 184520,
      mimeType: "application/pdf",
      fileStatus: "Processed",
      verificationStatus: "Verified",
      verifiedBy: "Dr. Anita Meena",
      verifiedAt: "2025-01-18T14:30:00.000Z",
      version: 1,
      isSampleDoc: true,
      extractedData: {
        name: "Rahul Kumar Soren",
        fatherName: "Ramesh Kumar Soren",
        dob: "1998-05-12",
        category: "ST",
        certificateNumber: "ST/JH/2023/88492",
        issueDate: "2023-04-15",
        issuingAuthority: "Sub-Divisional Officer, Ranchi",
        provider: "demo",
        extractedAt: "2025-01-16T10:20:00.000Z"
      },
      createdAt: "2025-01-16T10:15:00.000Z",
      updatedAt: "2025-01-18T14:30:00.000Z"
    },
    {
      id: "doc_1_income",
      applicationId: "app_1",
      schemeDocId: "req_income_cert",
      docType: "income_certificate",
      title: "Annual Family Income Certificate",
      fileName: "sample_income_cert_valid.pdf",
      originalFileName: "income_cert_2024.pdf",
      filePath: path2.join(uploadDir2, "sample_income_cert_valid.pdf"),
      fileSize: 142100,
      mimeType: "application/pdf",
      fileStatus: "Processed",
      verificationStatus: "Verified",
      verifiedBy: "Dr. Anita Meena",
      verifiedAt: "2025-01-18T14:35:00.000Z",
      version: 1,
      isSampleDoc: true,
      extractedData: {
        name: "Rahul Kumar Soren",
        annualIncome: 32e4,
        issueDate: "2024-05-10",
        expiryDate: "2025-05-09",
        issuingAuthority: "Tahsildar, Ranchi",
        provider: "demo",
        extractedAt: "2025-01-16T10:20:00.000Z"
      },
      createdAt: "2025-01-16T10:15:00.000Z",
      updatedAt: "2025-01-18T14:35:00.000Z"
    },
    {
      id: "doc_1_adm",
      applicationId: "app_1",
      schemeDocId: "req_admission_letter",
      docType: "admission_letter",
      title: "Ph.D. Admission / Enrolment Letter",
      fileName: "sample_admission_letter.pdf",
      originalFileName: "admission_letter_du.pdf",
      filePath: path2.join(uploadDir2, "sample_admission_letter.pdf"),
      fileSize: 220400,
      mimeType: "application/pdf",
      fileStatus: "Processed",
      verificationStatus: "Verified",
      verifiedBy: "Dr. Anita Meena",
      verifiedAt: "2025-01-18T14:40:00.000Z",
      version: 1,
      isSampleDoc: true,
      extractedData: {
        name: "Rahul Kumar Soren",
        institution: "Delhi University",
        course: "Ph.D. in Anthropology",
        issueDate: "2024-08-01",
        provider: "demo",
        extractedAt: "2025-01-16T10:20:00.000Z"
      },
      createdAt: "2025-01-16T10:15:00.000Z",
      updatedAt: "2025-01-18T14:40:00.000Z"
    },
    {
      id: "doc_1_degree",
      applicationId: "app_1",
      schemeDocId: "req_degree_cert",
      docType: "degree_certificate",
      title: "Postgraduate Degree Certificate & Marksheet",
      fileName: "sample_marksheet_pg.pdf",
      originalFileName: "pg_marksheet_msc.pdf",
      filePath: path2.join(uploadDir2, "sample_marksheet_pg.pdf"),
      fileSize: 195e3,
      mimeType: "application/pdf",
      fileStatus: "Processed",
      verificationStatus: "Verified",
      verifiedBy: "Dr. Anita Meena",
      verifiedAt: "2025-01-18T14:45:00.000Z",
      version: 1,
      isSampleDoc: true,
      extractedData: {
        name: "Rahul Kumar Soren",
        marksPercentage: 74.5,
        course: "M.Sc. Anthropology",
        institution: "Ranchi University",
        provider: "demo",
        extractedAt: "2025-01-16T10:20:00.000Z"
      },
      createdAt: "2025-01-16T10:15:00.000Z",
      updatedAt: "2025-01-18T14:45:00.000Z"
    },
    {
      id: "doc_1_research",
      applicationId: "app_1",
      schemeDocId: "req_research_proposal",
      docType: "research_proposal",
      title: "Research Proposal Synopsis",
      fileName: "sample_research_proposal.pdf",
      originalFileName: "research_proposal_santhal.pdf",
      filePath: path2.join(uploadDir2, "sample_research_proposal.pdf"),
      fileSize: 310500,
      mimeType: "application/pdf",
      fileStatus: "Processed",
      verificationStatus: "Verified",
      verifiedBy: "Dr. Anita Meena",
      verifiedAt: "2025-01-18T14:50:00.000Z",
      version: 1,
      isSampleDoc: true,
      extractedData: {
        name: "Rahul Kumar Soren",
        pageCount: 6,
        provider: "demo",
        extractedAt: "2025-01-16T10:20:00.000Z"
      },
      createdAt: "2025-01-16T10:15:00.000Z",
      updatedAt: "2025-01-18T14:50:00.000Z"
    }
  );
  documents.push({
    id: "doc_2_st",
    applicationId: "app_2",
    schemeDocId: "req_nos_st",
    docType: "st_certificate",
    title: "Scheduled Tribe Certificate",
    fileName: "sample_st_cert_matching.pdf",
    originalFileName: "st_cert_sunita.pdf",
    filePath: path2.join(uploadDir2, "sample_st_cert_matching.pdf"),
    fileSize: 18e4,
    mimeType: "application/pdf",
    fileStatus: "Processed",
    verificationStatus: "Verified",
    verifiedBy: "Dr. Anita Meena",
    verifiedAt: "2025-01-20T11:00:00.000Z",
    version: 1,
    isSampleDoc: true,
    extractedData: {
      name: "Sunita Kerketta",
      category: "ST",
      certificateNumber: "ST/JH/2023/70000",
      provider: "demo",
      extractedAt: "2025-01-19T11:05:00.000Z"
    },
    createdAt: "2025-01-19T11:00:00.000Z",
    updatedAt: "2025-01-20T11:00:00.000Z"
  });
  documents.push({
    id: "doc_3_st",
    applicationId: "app_3",
    schemeDocId: "req_st_cert",
    docType: "st_certificate",
    title: "Scheduled Tribe Certificate",
    fileName: "sample_st_cert_mismatch_name.pdf",
    originalFileName: "st_cert_mismatch_name.pdf",
    filePath: path2.join(uploadDir2, "sample_st_cert_mismatch_name.pdf"),
    fileSize: 18e4,
    mimeType: "application/pdf",
    fileStatus: "Processed",
    verificationStatus: "Needs Clarification",
    verificationRemarks: "Name on certificate appears as Bikash O. instead of Bikash Oraon. Please provide affidavit or clarification.",
    version: 1,
    isSampleDoc: true,
    extractedData: {
      name: "Bikash O.",
      category: "ST",
      certificateNumber: "ST/OD/2023/70001",
      provider: "demo",
      extractedAt: "2025-01-21T12:05:00.000Z"
    },
    createdAt: "2025-01-21T12:00:00.000Z",
    updatedAt: "2025-01-23T11:00:00.000Z"
  });
  documents.push({
    id: "doc_4_st",
    applicationId: "app_4",
    schemeDocId: "req_nos_st",
    docType: "st_certificate",
    title: "Scheduled Tribe Certificate",
    fileName: "sample_st_cert_mismatch_dob.pdf",
    originalFileName: "st_cert_mismatch_dob.pdf",
    filePath: path2.join(uploadDir2, "sample_st_cert_mismatch_dob.pdf"),
    fileSize: 18e4,
    mimeType: "application/pdf",
    fileStatus: "Processed",
    verificationStatus: "Needs Clarification",
    verificationRemarks: "DOB on certificate extracted as 1998-05-21, whereas application declares 1998-05-12.",
    version: 1,
    isSampleDoc: true,
    extractedData: {
      name: "Pooja Maravi",
      dob: "1998-05-21",
      category: "ST",
      certificateNumber: "ST/MP/2023/70002",
      provider: "demo",
      extractedAt: "2025-01-23T09:35:00.000Z"
    },
    createdAt: "2025-01-23T09:30:00.000Z",
    updatedAt: "2025-01-24T15:00:00.000Z"
  });
  documents.push({
    id: "doc_5_income",
    applicationId: "app_5",
    schemeDocId: "req_income_cert",
    docType: "income_certificate",
    title: "Income Certificate",
    fileName: "sample_income_cert_expired.pdf",
    originalFileName: "income_cert_expired.pdf",
    filePath: path2.join(uploadDir2, "sample_income_cert_expired.pdf"),
    fileSize: 14e4,
    mimeType: "application/pdf",
    fileStatus: "Processed",
    verificationStatus: "Rejected",
    verificationRemarks: "Income certificate expired on 2023-03-31. Current financial year certificate is mandatory.",
    version: 1,
    isSampleDoc: true,
    extractedData: {
      name: "Kishan Munda",
      annualIncome: 38e4,
      issueDate: "2022-04-10",
      expiryDate: "2023-03-31",
      issuingAuthority: "Tahsildar, Khunti",
      provider: "demo",
      extractedAt: "2025-01-24T14:25:00.000Z"
    },
    createdAt: "2025-01-24T14:20:00.000Z",
    updatedAt: "2025-01-26T10:00:00.000Z"
  });
  const deficiencies = [
    {
      id: "def_2_passport",
      applicationId: "app_2",
      category: "Missing Document",
      title: "Mandatory Passport Scanned Copy Missing",
      description: "Under National Overseas Scholarship (NOS) guidelines, a valid Indian Passport is mandatory for verification.",
      linkedField: "passport",
      dueDate: "2025-02-15",
      status: "Open",
      raisedBy: "Dr. Anita Meena",
      raisedAt: "2025-01-22T16:00:00.000Z",
      history: [
        {
          id: "def_hist_1",
          action: "Deficiency Raised",
          actorName: "Dr. Anita Meena",
          actorRole: "Verification Officer",
          remarks: "Applicant submitted NOS application without uploading passport copy.",
          createdAt: "2025-01-22T16:00:00.000Z"
        }
      ]
    },
    {
      id: "def_5_income",
      applicationId: "app_5",
      documentId: "doc_5_income",
      category: "Expired Certificate",
      title: "Expired Income Certificate Resubmission Required",
      description: "The uploaded income certificate expired on 2023-03-31. Please upload an active certificate for FY 2024-25.",
      linkedField: "annualIncome",
      dueDate: "2025-02-10",
      status: "Open",
      raisedBy: "Dr. Anita Meena",
      raisedAt: "2025-01-26T10:00:00.000Z",
      history: [
        {
          id: "def_hist_2",
          action: "Deficiency Raised",
          actorName: "Dr. Anita Meena",
          actorRole: "Verification Officer",
          remarks: "Rejected certificate due to validity lapse.",
          createdAt: "2025-01-26T10:00:00.000Z"
        }
      ]
    }
  ];
  const selectionRecords = [
    {
      id: "sel_app_10",
      applicationId: "app_10",
      schemeId: "scheme_nfst",
      applicantId: "app_prof_9",
      applicantName: "Kavita Deori",
      screeningScore: 88.5,
      scoreBreakdown: {
        academicMerit: 35.5,
        researchRelevance: 26,
        docVerification: 18,
        integrityBonus: 9
      },
      aiRecommendation: "Recommend shortlist",
      aiRecommendationReason: "Exceptional academic ranking (83.2% PG Botany), complete document scrutiny, and clear research alignment with indigenous pharmacology.",
      officerDecision: "Shortlist",
      officerRemarks: "Shortlisted by Selection Committee for Round 1 fellowship allocation.",
      createdAt: "2025-01-26T17:00:00.000Z"
    },
    {
      id: "sel_app_11",
      applicationId: "app_11",
      schemeId: "scheme_nfst",
      applicantId: "app_prof_0",
      applicantName: "Rahul Kumar Soren",
      screeningScore: 91,
      scoreBreakdown: {
        academicMerit: 36,
        researchRelevance: 28,
        docVerification: 18,
        integrityBonus: 9
      },
      aiRecommendation: "Recommend shortlist",
      aiRecommendationReason: "High merit score and research relevance to Santhal ethno-linguistics.",
      officerDecision: "Select",
      officerRemarks: "Selected under regular NFST fellowship allocation 2024-25.",
      finalizedBy: "Shri Rajesh Gond",
      finalizedAt: "2025-01-10T12:00:00.000Z",
      createdAt: "2025-01-08T15:00:00.000Z"
    }
  ];
  const postSelectionRecords = [
    {
      id: "post_sel_app_11",
      applicationId: "app_11",
      schemeId: "scheme_nfst",
      applicantId: "app_prof_0",
      applicantName: "Rahul Kumar Soren",
      awardAmount: "\u20B931,000 / month + HRA & Annual Contingency \u20B920,000",
      durationYears: 5,
      startDate: "2024-09-01",
      joiningStatus: "Active Fellow",
      requiredDocuments: [
        { code: "joining_report", title: "Department Joining Report signed by HoD", submitted: true, verified: true, remarks: "Verified by MoTA desk on 2024-10-05" },
        { code: "undertaking_bond", title: "Fellowship Undertaking Bond on Stamp Paper", submitted: true, verified: true, remarks: "Verified and registered" },
        { code: "mandate_form", title: "PFMS Bank Mandate Form with Branch Seal", submitted: true, verified: true, remarks: "Direct Benefit Transfer seeded" }
      ],
      remarks: "Fellowship activated. Regular semi-annual progress reports required.",
      updatedAt: "2025-01-20T10:00:00.000Z"
    }
  ];
  const progressRecords = [
    {
      id: "prog_1",
      applicationId: "app_11",
      semesterOrYear: "Semester 1 (Aug 2024 - Jan 2025)",
      progressTitle: "Literature Survey & Ethnobotanical Field Work in Dumka",
      researchSummary: "Completed cataloguing of 42 indigenous medicinal plant species documented in Santhal folk medicine with verified herbarium vouchers.",
      supervisorRemarks: "Excellent progress. Research work is on schedule and candidate has published one peer-reviewed symposium paper.",
      officerApprovalStatus: "Approved",
      officerRemarks: "Approved for fellowship continuation into Semester 2.",
      submittedAt: "2025-01-15T10:00:00.000Z",
      approvedAt: "2025-01-20T14:00:00.000Z"
    }
  ];
  const notifications = [
    {
      id: "notif_1",
      userId: "usr_applicant_0",
      title: "NFST Fellowship Continuation Approved",
      message: "Your Semester 1 progress report has been approved by the Ministry of Tribal Affairs officer.",
      type: "success",
      relatedApplicationId: "app_11",
      linkUrl: "/applicant/post-selection",
      isRead: false,
      createdAt: "2025-01-20T14:05:00.000Z"
    },
    {
      id: "notif_2",
      userId: "usr_applicant_0",
      title: "Application NFST-2025-001 Verified",
      message: "Your documents for application NFST-2025-001 have been successfully verified.",
      type: "info",
      relatedApplicationId: "app_1",
      linkUrl: "/applicant/applications/app_1",
      isRead: true,
      createdAt: "2025-01-18T15:00:00.000Z"
    },
    {
      id: "notif_3",
      userId: "usr_applicant_1",
      title: "Action Required: Deficiency Raised on NOS-2025-002",
      message: "Verification Officer noted missing passport copy. Please resolve before 15 Feb 2025.",
      type: "warning",
      relatedApplicationId: "app_2",
      linkUrl: "/applicant/deficiencies",
      isRead: false,
      createdAt: "2025-01-22T16:05:00.000Z"
    }
  ];
  const communications = [
    {
      id: "comm_1",
      applicationId: "app_2",
      senderId: "usr_officer_0",
      senderName: "Dr. Anita Meena",
      senderRole: "officer",
      recipientId: "usr_applicant_1",
      recipientName: "Sunita Kerketta",
      recipientRole: "applicant",
      message: "Dear Sunita, please upload a clear scanned copy of your valid Indian Passport under the Deficiency Resolution tab so your NOS overseas application can proceed.",
      linkedDeficiencyId: "def_2_passport",
      createdAt: "2025-01-22T16:10:00.000Z"
    }
  ];
  const auditLogs = [
    {
      id: "audit_init",
      userEmail: "admin@demo.com",
      userRole: "admin",
      action: "SYSTEM_SEED",
      entityType: "System",
      entityId: "ROOT",
      newValue: { status: "Database initialized with demo schemes, rules and applications." },
      ipAddress: "127.0.0.1",
      timestamp: "2025-01-01T00:00:00.000Z"
    },
    {
      id: "audit_sub_1",
      userEmail: "applicant@demo.com",
      userRole: "applicant",
      action: "SUBMIT_APPLICATION",
      entityType: "Application",
      entityId: "app_1",
      newValue: { applicationNumber: "NFST-2025-001", scheme: "NFST" },
      ipAddress: "192.168.1.15",
      timestamp: "2025-01-16T10:15:00.000Z"
    },
    {
      id: "audit_verif_1",
      userEmail: "officer@demo.com",
      userRole: "officer",
      action: "VERIFY_DOCUMENT",
      entityType: "Document",
      entityId: "doc_1_st",
      previousValue: { verificationStatus: "Pending" },
      newValue: { verificationStatus: "Verified", remarks: "ST Certificate verified against SDO portal." },
      ipAddress: "10.0.0.4",
      timestamp: "2025-01-18T14:30:00.000Z"
    }
  ];
  const consistencyResults = {};
  const eligibilityResults = {};
  for (const app2 of applications) {
    const appDocs = documents.filter((d) => d.applicationId === app2.id);
    const scheme = schemes.find((s) => s.id === app2.schemeId);
    const cResult = ConsistencyEngine.evaluate(app2, appDocs);
    consistencyResults[app2.id] = cResult;
    app2.consistencyScore = cResult.score;
    app2.riskLevel = cResult.riskLevel;
    if (scheme) {
      const eResult = EligibilityEngine.evaluate(app2, appDocs, scheme.eligibilityRules);
      eligibilityResults[app2.id] = eResult;
      app2.eligibilityStatus = eResult.overallStatus;
    }
  }
  db.replaceAll({
    users,
    applicants,
    schemes,
    applications,
    documents,
    deficiencies,
    eligibilityResults,
    consistencyResults,
    selectionRecords,
    postSelectionRecords,
    progressRecords,
    notifications,
    communications,
    auditLogs,
    aiCache: {}
  });
  console.log("Seed completed successfully. 11 applications, 4 primary accounts and schemes initialized.");
}

// backend/routes/auth.ts
import { Router } from "express";
import bcrypt2 from "bcryptjs";
import { z } from "zod";

// backend/middleware/auth.ts
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "mota-tribal-scholarship-jwt-secret-key-2025";
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
function authenticate(req, res, next) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }
  if (!token) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required. Please log in." }
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.id);
    if (!user || !user.active) {
      return res.status(401).json({
        error: { code: "USER_NOT_FOUND", message: "User account not found or deactivated." }
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: "INVALID_TOKEN", message: "Session expired or invalid token." }
    });
  }
}
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required." }
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Requires one of roles: [${allowedRoles.join(", ")}], current role is "${req.user.role}".`
        }
      });
    }
    next();
  };
}

// backend/routes/auth.ts
var authRouter = Router();
var RegisterSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  dob: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  category: z.literal("ST").default("ST"),
  stCertNumber: z.string().optional(),
  stCertAuthority: z.string().optional(),
  stCertDate: z.string().optional(),
  qualification: z.string().optional()
});
var LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
authRouter.post("/register", async (req, res) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const existing = db.findUserByEmail(validated.email);
    if (existing) {
      return res.status(400).json({
        error: { code: "DUPLICATE_EMAIL", message: "An account with this email address already exists." }
      });
    }
    const salt = bcrypt2.genSaltSync(10);
    const passwordHash = bcrypt2.hashSync(validated.password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const user = {
      id: userId,
      email: validated.email.toLowerCase(),
      passwordHash,
      role: "applicant",
      fullName: validated.fullName,
      mobile: validated.mobile,
      active: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.saveUser(user);
    const applicant = {
      id: `app_prof_${Date.now()}`,
      userId: user.id,
      fullName: validated.fullName,
      email: validated.email.toLowerCase(),
      mobile: validated.mobile,
      dob: validated.dob || "1998-01-01",
      gender: validated.gender || "Male",
      state: validated.state || "Jharkhand",
      district: validated.district || "Ranchi",
      category: "ST",
      stCertNumber: validated.stCertNumber || "",
      stCertAuthority: validated.stCertAuthority || "",
      stCertDate: validated.stCertDate || "",
      qualification: validated.qualification || "Master's degree",
      annualIncome: 3e5,
      address: "",
      pincode: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      profileCompleted: false,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.saveApplicant(applicant);
    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: "USER_REGISTER",
      entityType: "User",
      entityId: user.id,
      newValue: { email: user.email, role: user.role },
      ipAddress: req.ip || "127.0.0.1"
    });
    const token = generateToken(user);
    return res.status(201).json({
      message: "Registration successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        mobile: user.mobile
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = err.issues || err.errors || [];
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: issues[0]?.message || "Invalid input data" }
      });
    }
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: err.message || "Registration failed" }
    });
  }
});
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const user = db.findUserByEmail(email);
    if (!user || !bcrypt2.compareSync(password, user.passwordHash)) {
      return res.status(401).json({
        error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." }
      });
    }
    if (!user.active) {
      return res.status(403).json({
        error: { code: "ACCOUNT_DEACTIVATED", message: "Account is deactivated. Contact administrator." }
      });
    }
    const token = generateToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      // development iframe compatibility
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3
    });
    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: "USER_LOGIN",
      entityType: "User",
      entityId: user.id,
      newValue: { loginTime: (/* @__PURE__ */ new Date()).toISOString() },
      ipAddress: req.ip || "127.0.0.1"
    });
    const applicantProfile = user.role === "applicant" ? db.findApplicantByUserId(user.id) : void 0;
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        mobile: user.mobile
      },
      applicantProfile
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = err.issues || err.errors || [];
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: issues[0]?.message || "Invalid email or password format" }
      });
    }
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Authentication failed." }
    });
  }
});
authRouter.get("/me", authenticate, (req, res) => {
  const user = req.user;
  const applicantProfile = user.role === "applicant" ? db.findApplicantByUserId(user.id) : void 0;
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      mobile: user.mobile
    },
    applicantProfile
  });
});
authRouter.post("/update-profile", authenticate, (req, res) => {
  const user = req.user;
  let profile = db.findApplicantByUserId(user.id);
  if (!profile) {
    profile = {
      id: `app_prof_${Date.now()}`,
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      dob: "1998-01-01",
      gender: "Male",
      state: "Jharkhand",
      district: "Ranchi",
      category: "ST",
      stCertNumber: "",
      stCertAuthority: "",
      stCertDate: "",
      qualification: "Master's degree",
      annualIncome: 3e5,
      address: "",
      pincode: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      profileCompleted: false,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const updatedProfile = {
    ...profile,
    ...req.body,
    userId: user.id,
    profileCompleted: true,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.saveApplicant(updatedProfile);
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "UPDATE_PROFILE",
    entityType: "ApplicantProfile",
    entityId: updatedProfile.id,
    newValue: req.body,
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({
    message: "Profile updated successfully.",
    applicantProfile: updatedProfile
  });
});
authRouter.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out successfully." });
});

// backend/routes/schemes.ts
import { Router as Router2 } from "express";
var schemesRouter = Router2();
schemesRouter.get("/", (req, res) => {
  const schemes = db.getSchemes();
  res.json(schemes);
});
schemesRouter.get("/:id", (req, res) => {
  const scheme = db.findSchemeById(req.params.id);
  if (!scheme) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Scheme not found." } });
  }
  res.json(scheme);
});
schemesRouter.post("/", authenticate, requireRole(["admin"]), (req, res) => {
  const body = req.body;
  if (!body.code || !body.name) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Scheme code and name are required." } });
  }
  const existing = db.findSchemeById(body.code);
  if (existing) {
    return res.status(400).json({ error: { code: "DUPLICATE", message: "Scheme with this code already exists." } });
  }
  const newScheme = {
    id: `scheme_${body.code.toLowerCase()}`,
    code: body.code.toUpperCase(),
    name: body.name,
    fullName: body.fullName || body.name,
    description: body.description || "",
    applicationStart: body.applicationStart || "2025-01-01",
    applicationEnd: body.applicationEnd || "2025-12-31",
    active: body.active !== void 0 ? body.active : true,
    totalSeats: body.totalSeats || 500,
    academicYear: body.academicYear || "2025-26",
    formSections: body.formSections || [],
    requiredDocuments: body.requiredDocuments || [],
    eligibilityRules: body.eligibilityRules || [],
    selectionCriteria: body.selectionCriteria || [],
    workflowStages: body.workflowStages || [
      { id: "stg_1", order: 1, code: "SUBMITTED", name: "Application Submitted", description: "Application filed", assignedRole: "applicant" },
      { id: "stg_2", order: 2, code: "DOC_VERIF", name: "Document Verification", description: "Verification by officer", assignedRole: "officer" },
      { id: "stg_3", order: 3, code: "ELIG_EVAL", name: "Eligibility Review", description: "Rule evaluation", assignedRole: "officer" },
      { id: "stg_4", order: 4, code: "SCREENING", name: "Merit Screening", description: "Scoring and rank", assignedRole: "selection" },
      { id: "stg_5", order: 5, code: "FINAL_DECISION", name: "Final Selection", description: "Final award decision", assignedRole: "selection" },
      { id: "stg_6", order: 6, code: "POST_SELECTION", name: "Post-Selection Monitoring", description: "Progress monitoring", assignedRole: "officer" }
    ]
  };
  db.saveScheme(newScheme);
  db.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: "CREATE_SCHEME",
    entityType: "Scheme",
    entityId: newScheme.id,
    newValue: newScheme,
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.status(201).json({ message: "Scheme created successfully.", scheme: newScheme });
});
schemesRouter.put("/:id", authenticate, requireRole(["admin"]), (req, res) => {
  const scheme = db.findSchemeById(req.params.id);
  if (!scheme) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Scheme not found." } });
  }
  const prev = { ...scheme };
  const updatedScheme = {
    ...scheme,
    ...req.body,
    id: scheme.id
    // protect ID
  };
  db.saveScheme(updatedScheme);
  db.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: "UPDATE_SCHEME",
    entityType: "Scheme",
    entityId: scheme.id,
    previousValue: prev,
    newValue: updatedScheme,
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "Scheme updated successfully.", scheme: updatedScheme });
});
schemesRouter.put("/:id/rules", authenticate, requireRole(["admin"]), (req, res) => {
  const scheme = db.findSchemeById(req.params.id);
  if (!scheme) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Scheme not found." } });
  }
  const prevRules = scheme.eligibilityRules;
  scheme.eligibilityRules = req.body.rules || [];
  db.saveScheme(scheme);
  db.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: "UPDATE_SCHEME_RULES",
    entityType: "Scheme",
    entityId: scheme.id,
    previousValue: prevRules,
    newValue: scheme.eligibilityRules,
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "Eligibility rules updated successfully.", rules: scheme.eligibilityRules });
});
schemesRouter.put("/:id/documents", authenticate, requireRole(["admin"]), (req, res) => {
  const scheme = db.findSchemeById(req.params.id);
  if (!scheme) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Scheme not found." } });
  }
  const prevDocs = scheme.requiredDocuments;
  scheme.requiredDocuments = req.body.documents || [];
  db.saveScheme(scheme);
  db.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: "UPDATE_SCHEME_DOCS",
    entityType: "Scheme",
    entityId: scheme.id,
    previousValue: prevDocs,
    newValue: scheme.requiredDocuments,
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "Required documents updated successfully.", documents: scheme.requiredDocuments });
});
schemesRouter.put("/:id/criteria", authenticate, requireRole(["admin"]), (req, res) => {
  const scheme = db.findSchemeById(req.params.id);
  if (!scheme) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Scheme not found." } });
  }
  const prevCriteria = scheme.selectionCriteria;
  scheme.selectionCriteria = req.body.criteria || [];
  db.saveScheme(scheme);
  db.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: "UPDATE_SELECTION_CRITERIA",
    entityType: "Scheme",
    entityId: scheme.id,
    previousValue: prevCriteria,
    newValue: scheme.selectionCriteria,
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "Selection criteria updated successfully.", criteria: scheme.selectionCriteria });
});

// backend/routes/applications.ts
import { Router as Router3 } from "express";
var applicationsRouter = Router3();
applicationsRouter.get("/", authenticate, (req, res) => {
  const user = req.user;
  let apps = db.getApplications();
  if (user.role === "applicant") {
    const profile = db.findApplicantByUserId(user.id);
    apps = apps.filter((a) => a.applicantId === profile?.id || a.applicantEmail.toLowerCase() === user.email.toLowerCase());
  }
  const { scheme, status, risk, eligibility, state, search } = req.query;
  if (scheme) {
    apps = apps.filter((a) => a.schemeId === scheme || a.schemeId.toLowerCase().includes(String(scheme).toLowerCase()));
  }
  if (status) {
    apps = apps.filter((a) => a.status.toLowerCase() === String(status).toLowerCase());
  }
  if (risk) {
    apps = apps.filter((a) => a.riskLevel === String(risk));
  }
  if (eligibility) {
    apps = apps.filter((a) => a.eligibilityStatus === String(eligibility));
  }
  if (state) {
    apps = apps.filter((a) => a.data?.state?.toLowerCase() === String(state).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    apps = apps.filter(
      (a) => a.applicationNumber.toLowerCase().includes(q) || a.applicantName.toLowerCase().includes(q) || a.applicantEmail.toLowerCase().includes(q) || a.schemeId.toLowerCase().includes(q) || a.status.toLowerCase().includes(q)
    );
  }
  apps.sort((a, b) => new Date(b.lastUpdatedAt || b.createdAt).getTime() - new Date(a.lastUpdatedAt || a.createdAt).getTime());
  res.json(apps);
});
applicationsRouter.get("/:id", authenticate, (req, res) => {
  const user = req.user;
  const app2 = db.findApplicationById(req.params.id);
  if (!app2) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
  }
  if (user.role === "applicant") {
    const profile = db.findApplicantByUserId(user.id);
    if (app2.applicantId !== profile?.id && app2.applicantEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied to this application." } });
    }
  }
  const documents = db.getDocumentsByApplicationId(app2.id);
  const deficiencies = db.getDeficienciesByApplicationId(app2.id);
  const consistency = db.getConsistency(app2.id);
  const eligibility = db.getEligibility(app2.id);
  const selection = db.findSelectionByApplicationId(app2.id);
  const postSelection = db.findPostSelectionByApplicationId(app2.id);
  const progressRecords = db.getProgressRecordsByApplicationId(app2.id);
  const communications = db.getCommunicationsByApplicationId(app2.id);
  const scheme = db.findSchemeById(app2.schemeId);
  res.json({
    application: app2,
    scheme,
    documents,
    deficiencies,
    consistency,
    eligibility,
    selection,
    postSelection,
    progressRecords,
    communications
  });
});
applicationsRouter.post("/", authenticate, (req, res) => {
  const user = req.user;
  if (user.role !== "applicant") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only applicants can create applications." } });
  }
  const { schemeId, initialData } = req.body;
  const scheme = db.findSchemeById(schemeId);
  if (!scheme) {
    return res.status(400).json({ error: { code: "INVALID_SCHEME", message: "Selected scheme does not exist." } });
  }
  const profile = db.findApplicantByUserId(user.id);
  const applicantId = profile?.id || `app_prof_${user.id}`;
  const count = db.getApplications().length + 1;
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const appNumber = `${scheme.code}-${year}-${String(count).padStart(3, "0")}`;
  const newApp = {
    id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    applicationNumber: appNumber,
    schemeId: scheme.id,
    applicantId,
    applicantName: user.fullName,
    applicantEmail: user.email,
    status: "Draft",
    currentStage: "SUBMITTED",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    data: {
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      category: "ST",
      ...profile || {},
      ...initialData || {}
    }
  };
  db.saveApplication(newApp);
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "CREATE_DRAFT_APPLICATION",
    entityType: "Application",
    entityId: newApp.id,
    newValue: { applicationNumber: newApp.applicationNumber, scheme: scheme.code },
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.status(201).json({
    message: "Application draft created successfully.",
    application: newApp
  });
});
applicationsRouter.put("/:id", authenticate, (req, res) => {
  const user = req.user;
  const app2 = db.findApplicationById(req.params.id);
  if (!app2) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
  }
  if (user.role === "applicant") {
    const profile = db.findApplicantByUserId(user.id);
    if (app2.applicantId !== profile?.id && app2.applicantEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied." } });
    }
    if (app2.status !== "Draft" && app2.status !== "Deficient") {
      return res.status(400).json({
        error: { code: "IMMUTABLE_APPLICATION", message: "Submitted applications cannot be modified unless deficiency is raised." }
      });
    }
  }
  const prev = { ...app2 };
  app2.data = {
    ...app2.data || {},
    ...req.body.data || {}
  };
  app2.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
  if (app2.status === "Deficient" && user.role === "applicant") {
    const defs = db.getDeficienciesByApplicationId(app2.id).filter((d) => d.status === "Open");
    for (const d of defs) {
      if (d.linkedField && req.body.data && req.body.data[d.linkedField] !== void 0) {
        d.status = "Resubmitted";
        d.history.push({
          id: `hist_${Date.now()}`,
          action: "Field Corrected & Resubmitted",
          actorName: user.fullName,
          actorRole: user.role,
          remarks: `Applicant updated field "${d.linkedField}".`,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        db.saveDeficiency(d);
      }
    }
  }
  db.saveApplication(app2);
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "UPDATE_APPLICATION_DRAFT",
    entityType: "Application",
    entityId: app2.id,
    previousValue: prev.data,
    newValue: app2.data,
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "Application saved successfully.", application: app2 });
});
applicationsRouter.post("/:id/submit", authenticate, (req, res) => {
  const user = req.user;
  const app2 = db.findApplicationById(req.params.id);
  if (!app2) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
  }
  if (user.role === "applicant") {
    const profile = db.findApplicantByUserId(user.id);
    if (app2.applicantId !== profile?.id && app2.applicantEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied." } });
    }
  }
  const scheme = db.findSchemeById(app2.schemeId);
  if (!scheme) {
    return res.status(400).json({ error: { code: "INVALID_SCHEME", message: "Scheme not found." } });
  }
  const appData = app2.data || {};
  if (!appData.agreedTerms) {
    return res.status(400).json({
      error: { code: "DECLARATION_REQUIRED", message: "You must accept the statutory declaration before submitting." }
    });
  }
  const documents = db.getDocumentsByApplicationId(app2.id);
  const consistency = ConsistencyEngine.evaluate(app2, documents);
  db.saveConsistency(app2.id, consistency);
  const eligibility = EligibilityEngine.evaluate(app2, documents, scheme.eligibilityRules);
  db.saveEligibility(app2.id, eligibility);
  const uploadedDocCodes = new Set(documents.map((d) => d.docType));
  const missingMandatoryDocs = scheme.requiredDocuments.filter((r) => r.mandatory && !uploadedDocCodes.has(r.code));
  let finalStatus = "Submitted";
  if (missingMandatoryDocs.length > 0) {
    finalStatus = "Deficient";
    for (const m of missingMandatoryDocs) {
      const defId = `def_${Date.now()}_${m.code}`;
      const def = {
        id: defId,
        applicationId: app2.id,
        category: "Missing Document",
        title: `Mandatory Document Missing: ${m.title}`,
        description: `Your application lacks the mandatory upload for ${m.title} (${m.description}). Please upload it promptly to proceed.`,
        linkedField: m.code,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
        status: "Open",
        raisedBy: "Automated Deficiency System",
        raisedAt: (/* @__PURE__ */ new Date()).toISOString(),
        history: [
          {
            id: `hist_${Date.now()}`,
            action: "Automated Deficiency Created",
            actorName: "Rule Engine",
            actorRole: "System",
            remarks: `Missing mandatory file ${m.title} upon initial submission.`,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        ]
      };
      db.saveDeficiency(def);
    }
  }
  app2.status = finalStatus;
  app2.currentStage = finalStatus === "Deficient" ? "DOC_VERIF" : "DOC_VERIF";
  app2.submittedAt = (/* @__PURE__ */ new Date()).toISOString();
  app2.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
  app2.consistencyScore = consistency.score;
  app2.riskLevel = consistency.riskLevel;
  app2.eligibilityStatus = eligibility.overallStatus;
  db.saveApplication(app2);
  db.addNotification({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: `Application ${app2.applicationNumber} Submitted`,
    message: finalStatus === "Deficient" ? `Your application ${app2.applicationNumber} was received with missing documents. Please view the Deficiencies tab.` : `Your application ${app2.applicationNumber} has been successfully submitted and forwarded for Document Verification.`,
    type: finalStatus === "Deficient" ? "warning" : "success",
    relatedApplicationId: app2.id,
    linkUrl: `/applicant/applications/${app2.id}`,
    isRead: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "SUBMIT_APPLICATION",
    entityType: "Application",
    entityId: app2.id,
    newValue: { status: app2.status, consistencyScore: consistency.score, eligibilityStatus: eligibility.overallStatus },
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({
    message: "Application submitted successfully.",
    application: app2,
    consistency,
    eligibility
  });
});
applicationsRouter.post("/:id/transition", authenticate, (req, res) => {
  const user = req.user;
  if (user.role === "applicant") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only officers can transition stages." } });
  }
  const app2 = db.findApplicationById(req.params.id);
  if (!app2) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
  }
  const { targetStage, targetStatus, remarks } = req.body;
  const openDeficiencies = db.getDeficienciesByApplicationId(app2.id).filter((d) => d.status === "Open" || d.status === "Resubmitted");
  if (openDeficiencies.length > 0 && targetStage !== "DOC_VERIF") {
    return res.status(400).json({
      error: {
        code: "OPEN_DEFICIENCIES_BLOCKED",
        message: `Cannot advance application to "${targetStage}". There are ${openDeficiencies.length} open deficiency items awaiting resolution.`
      }
    });
  }
  const prevStage = app2.currentStage;
  const prevStatus = app2.status;
  if (targetStage) app2.currentStage = targetStage;
  if (targetStatus) app2.status = targetStatus;
  app2.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveApplication(app2);
  const applicantUser = db.findUserByEmail(app2.applicantEmail);
  if (applicantUser) {
    db.addNotification({
      id: `notif_${Date.now()}`,
      userId: applicantUser.id,
      title: `Application Stage Updated: ${app2.applicationNumber}`,
      message: `Your application has progressed to stage: ${targetStage || app2.currentStage}. Remarks: ${remarks || "Stage approved."}`,
      type: "info",
      relatedApplicationId: app2.id,
      linkUrl: `/applicant/applications/${app2.id}`,
      isRead: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "TRANSITION_STAGE",
    entityType: "Application",
    entityId: app2.id,
    previousValue: { stage: prevStage, status: prevStatus },
    newValue: { stage: app2.currentStage, status: app2.status, remarks },
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({
    message: `Application transitioned to ${app2.currentStage} (${app2.status}).`,
    application: app2
  });
});

// backend/routes/documents.ts
import { Router as Router4 } from "express";
import multer from "multer";
import path3 from "path";
import fs4 from "fs";

// backend/ai/ocrProvider.ts
import fs3 from "fs";
import { z as z2 } from "zod";
var ExtractedFieldsSchema = z2.object({
  name: z2.string().optional(),
  fatherName: z2.string().optional(),
  dob: z2.string().optional(),
  certificateNumber: z2.string().optional(),
  issueDate: z2.string().optional(),
  expiryDate: z2.string().optional(),
  issuingAuthority: z2.string().optional(),
  institution: z2.string().optional(),
  course: z2.string().optional(),
  marksPercentage: z2.number().optional(),
  annualIncome: z2.number().optional(),
  category: z2.string().optional(),
  passportNumber: z2.string().optional(),
  pageCount: z2.number().optional(),
  confidenceScores: z2.record(z2.string(), z2.number()).optional(),
  rawNotes: z2.string().optional()
});
var DemoOcrProvider = class {
  async extract(filePath, originalFileName, docType, applicantData) {
    const lowerName = (originalFileName || "").toLowerCase();
    const app2 = applicantData || {};
    const isNameMismatch = lowerName.includes("mismatch_name") || lowerName.includes("name_diff");
    const isDobMismatch = lowerName.includes("mismatch_dob") || lowerName.includes("dob_diff");
    const isExpired = lowerName.includes("expired") || lowerName.includes("old_cert");
    const isInstitutionMismatch = lowerName.includes("wrong_inst") || lowerName.includes("diff_inst");
    const isMissingPage = lowerName.includes("missing_page");
    const baseName = app2.fullName || "Rahul Kumar";
    const baseDob = app2.dob || "1998-05-12";
    const baseIncome = Number(app2.annualIncome || 32e4);
    const baseInst = app2.researchInstitution || app2.universityName || "Delhi University";
    const baseCourse = app2.course || app2.degreeName || "Ph.D. in Tribal Studies";
    const baseMarks = Number(app2.postgraduatePercentage || app2.marksPercentage || 74.5);
    let extractedName = baseName;
    if (isNameMismatch) {
      const parts = baseName.split(" ");
      extractedName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : `${baseName} K.`;
    }
    let extractedDob = baseDob;
    if (isDobMismatch) {
      extractedDob = "1998-05-21";
    }
    let issueDate = "2023-04-15";
    let expiryDate = void 0;
    if (isExpired) {
      issueDate = "2020-01-10";
      expiryDate = "2022-03-31";
    } else {
      if (docType === "income_certificate") {
        issueDate = "2024-05-10";
        expiryDate = "2025-05-09";
      } else if (docType === "passport") {
        issueDate = "2021-02-14";
        expiryDate = "2031-02-13";
      }
    }
    let extractedInst = baseInst;
    if (isInstitutionMismatch) {
      extractedInst = "National Institute of Technology, Rourkela";
    }
    const confidenceScores = {
      name: isNameMismatch ? 0.88 : 0.98,
      dob: isDobMismatch ? 0.85 : 0.99,
      certificateNumber: 0.96,
      issuingAuthority: 0.94,
      institution: 0.95,
      marksPercentage: 0.97
    };
    return {
      name: extractedName,
      fatherName: app2.fatherName || "Ramesh Kumar",
      dob: extractedDob,
      certificateNumber: docType === "st_certificate" ? app2.stCertNumber || "ST/JH/2023/88492" : docType === "income_certificate" ? "INC/2024/77481" : docType === "passport" ? "Z4829104" : "CERT-2023-9012",
      issueDate,
      expiryDate,
      issuingAuthority: docType === "st_certificate" ? "Sub-Divisional Officer, Ranchi" : docType === "income_certificate" ? "Tahsildar, District Administration" : docType === "passport" ? "Regional Passport Office, Delhi" : "Registrar, University Examination Board",
      institution: extractedInst,
      course: baseCourse,
      marksPercentage: baseMarks,
      annualIncome: baseIncome,
      category: "ST",
      passportNumber: docType === "passport" ? "Z4829104" : void 0,
      pageCount: isMissingPage ? 1 : 2,
      confidenceScores,
      rawNotes: `Demo extraction simulated accurately based on uploaded document metadata.`,
      provider: "demo",
      extractedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};
var GeminiOcrProvider = class {
  constructor() {
    this.demoFallback = new DemoOcrProvider();
  }
  async extract(filePath, originalFileName, docType, applicantData) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return this.demoFallback.extract(filePath, originalFileName, docType, applicantData);
    }
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI();
      let fileBuffer = null;
      if (fs3.existsSync(filePath)) {
        fileBuffer = await fs3.promises.readFile(filePath);
      }
      if (!fileBuffer) {
        return this.demoFallback.extract(filePath, originalFileName, docType, applicantData);
      }
      const mimeType = filePath.endsWith(".pdf") ? "application/pdf" : filePath.endsWith(".png") ? "image/png" : "image/jpeg";
      const prompt = `You are a high-accuracy government document OCR and verification assistant.
Analyze this document (type: "${docType}", file name: "${originalFileName}").
Extract the following fields in strict JSON:
- name: string (Full Name of Candidate as stated on the document)
- fatherName: string or null
- dob: string (YYYY-MM-DD or as written) or null
- certificateNumber: string or null
- issueDate: string (YYYY-MM-DD) or null
- expiryDate: string (YYYY-MM-DD) or null
- issuingAuthority: string or null
- institution: string or null
- course: string or null
- marksPercentage: number or null
- annualIncome: number or null
- category: string or null
- passportNumber: string or null
- pageCount: number (estimated)
- confidenceScores: object with field names and scores between 0.0 and 1.0

Return ONLY the raw JSON object, without backticks or markdown formatting.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: fileBuffer.toString("base64")
                }
              },
              {
                text: prompt
              }
            ]
          }
        ]
      });
      const responseText = response.text?.trim() || "";
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      const validated = ExtractedFieldsSchema.parse(parsed);
      return {
        ...validated,
        provider: "gemini",
        extractedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (err) {
      console.warn("Gemini OCR failed or unavailable, falling back to Demo OCR:", err);
      const fallback = await this.demoFallback.extract(filePath, originalFileName, docType, applicantData);
      return {
        ...fallback,
        rawNotes: "AI service unavailable or timed out; deterministic rule-based OCR extraction used."
      };
    }
  }
};
var ocrProvider = process.env.GEMINI_API_KEY ? new GeminiOcrProvider() : new DemoOcrProvider();

// backend/routes/documents.ts
var documentsRouter = Router4();
var uploadDir = path3.resolve(process.env.UPLOAD_DIR || "./uploads");
if (!fs4.existsSync(uploadDir)) {
  fs4.mkdirSync(uploadDir, { recursive: true });
}
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path3.extname(file.originalname).toLowerCase();
    const safeName = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`;
    cb(null, safeName);
  }
});
var upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedMime = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, JPG, and PNG files under 5MB are permitted."));
    }
  }
});
documentsRouter.post("/upload", authenticate, upload.single("file"), async (req, res) => {
  try {
    const user = req.user;
    const file = req.file;
    const { applicationId, schemeDocId, docType, title } = req.body;
    if (!applicationId || !docType) {
      return res.status(400).json({ error: { code: "MISSING_DATA", message: "Application ID and document type are required." } });
    }
    const app2 = db.findApplicationById(applicationId);
    if (!app2) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
    }
    if (!file) {
      return res.status(400).json({ error: { code: "FILE_REQUIRED", message: "No document file uploaded." } });
    }
    const existing = db.getDocumentsByApplicationId(applicationId).find((d) => d.docType === docType);
    const newVersion = existing ? existing.version + 1 : 1;
    const docId = existing ? existing.id : `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newDoc = {
      id: docId,
      applicationId: app2.id,
      schemeDocId: schemeDocId || docType,
      docType,
      title: title || existing?.title || docType,
      fileName: file.filename,
      originalFileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileStatus: "Processing",
      verificationStatus: "Pending",
      version: newVersion,
      createdAt: existing ? existing.createdAt : (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.saveDocument(newDoc);
    const extractedData = await ocrProvider.extract(file.path, file.originalname, docType, app2.data);
    newDoc.extractedData = extractedData;
    newDoc.fileStatus = "Processed";
    db.saveDocument(newDoc);
    const deficiencies = db.getDeficienciesByApplicationId(app2.id).filter(
      (d) => (d.documentId === newDoc.id || d.linkedField === docType) && (d.status === "Open" || d.status === "Rejected")
    );
    for (const d of deficiencies) {
      d.status = "Resubmitted";
      d.resubmittedDocumentId = newDoc.id;
      d.history.push({
        id: `hist_${Date.now()}`,
        action: "Document Resubmitted",
        actorName: user.fullName,
        actorRole: user.role,
        remarks: `Applicant uploaded version ${newDoc.version} of ${newDoc.title}.`,
        documentVersion: newDoc.version,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      db.saveDeficiency(d);
    }
    const allDocs = db.getDocumentsByApplicationId(app2.id);
    const consistency = ConsistencyEngine.evaluate(app2, allDocs);
    db.saveConsistency(app2.id, consistency);
    app2.consistencyScore = consistency.score;
    app2.riskLevel = consistency.riskLevel;
    app2.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.saveApplication(app2);
    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: "UPLOAD_DOCUMENT",
      entityType: "Document",
      entityId: newDoc.id,
      newValue: { fileName: file.originalname, docType, version: newDoc.version },
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.status(201).json({
      message: "Document uploaded and analyzed successfully.",
      document: newDoc,
      consistency
    });
  } catch (err) {
    return res.status(500).json({ error: { code: "UPLOAD_FAILED", message: err.message || "File upload failed." } });
  }
});
documentsRouter.post("/sample-attach", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { applicationId, schemeDocId, docType, sampleScenario } = req.body;
    const app2 = db.findApplicationById(applicationId);
    if (!app2) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
    }
    let sampleFileName = "sample_st_cert_matching.pdf";
    let title = "Scheduled Tribe Certificate";
    if (docType === "st_certificate") {
      title = "Scheduled Tribe Certificate";
      if (sampleScenario === "mismatch_name") sampleFileName = "sample_st_cert_mismatch_name.pdf";
      else if (sampleScenario === "mismatch_dob") sampleFileName = "sample_st_cert_mismatch_dob.pdf";
      else sampleFileName = "sample_st_cert_matching.pdf";
    } else if (docType === "income_certificate") {
      title = "Income Certificate";
      if (sampleScenario === "expired") sampleFileName = "sample_income_cert_expired.pdf";
      else sampleFileName = "sample_income_cert_valid.pdf";
    } else if (docType === "passport") {
      title = "Valid Indian Passport";
      sampleFileName = "sample_passport_valid.pdf";
    } else if (docType === "admission_letter") {
      title = "Admission / Enrolment Letter";
      sampleFileName = "sample_admission_letter.pdf";
    } else if (docType === "degree_certificate") {
      title = "Postgraduate Marksheet / Degree";
      sampleFileName = "sample_marksheet_pg.pdf";
    } else if (docType === "research_proposal") {
      title = "Research Proposal Synopsis";
      sampleFileName = "sample_research_proposal.pdf";
    }
    const filePath = path3.join(uploadDir, sampleFileName);
    if (!fs4.existsSync(filePath)) {
      fs4.writeFileSync(filePath, `DEMO SAMPLE FILE: ${title} (${sampleScenario || "standard"})`, "utf-8");
    }
    const existing = db.getDocumentsByApplicationId(app2.id).find((d) => d.docType === docType);
    const newVersion = existing ? existing.version + 1 : 1;
    const docId = existing ? existing.id : `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newDoc = {
      id: docId,
      applicationId: app2.id,
      schemeDocId: schemeDocId || docType,
      docType,
      title,
      fileName: sampleFileName,
      originalFileName: sampleFileName,
      filePath,
      fileSize: 154200,
      mimeType: "application/pdf",
      fileStatus: "Processing",
      verificationStatus: "Pending",
      version: newVersion,
      isSampleDoc: true,
      createdAt: existing ? existing.createdAt : (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.saveDocument(newDoc);
    const extractedData = await ocrProvider.extract(filePath, sampleFileName, docType, app2.data);
    newDoc.extractedData = extractedData;
    newDoc.fileStatus = "Processed";
    db.saveDocument(newDoc);
    const defs = db.getDeficienciesByApplicationId(app2.id).filter(
      (d) => (d.documentId === newDoc.id || d.linkedField === docType) && (d.status === "Open" || d.status === "Rejected")
    );
    for (const d of defs) {
      d.status = "Resubmitted";
      d.resubmittedDocumentId = newDoc.id;
      d.history.push({
        id: `hist_${Date.now()}`,
        action: "Sample Document Attached & Resubmitted",
        actorName: user.fullName,
        actorRole: user.role,
        remarks: `Attached sample file (${sampleScenario || "standard"}).`,
        documentVersion: newDoc.version,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      db.saveDeficiency(d);
    }
    const allDocs = db.getDocumentsByApplicationId(app2.id);
    const consistency = ConsistencyEngine.evaluate(app2, allDocs);
    db.saveConsistency(app2.id, consistency);
    app2.consistencyScore = consistency.score;
    app2.riskLevel = consistency.riskLevel;
    app2.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.saveApplication(app2);
    return res.json({
      message: "Sample document attached and processed.",
      document: newDoc,
      consistency
    });
  } catch (err) {
    return res.status(500).json({ error: { code: "SAMPLE_ATTACH_ERROR", message: err.message } });
  }
});
documentsRouter.post("/:id/verify", authenticate, (req, res) => {
  const user = req.user;
  if (user.role === "applicant") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only officers can verify documents." } });
  }
  const doc = db.findDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document not found." } });
  }
  const prev = { ...doc };
  doc.verificationStatus = "Verified";
  doc.verificationRemarks = req.body.remarks || "Document verified authentic by verification officer.";
  doc.verifiedBy = user.fullName;
  doc.verifiedAt = (/* @__PURE__ */ new Date()).toISOString();
  doc.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveDocument(doc);
  const app2 = db.findApplicationById(doc.applicationId);
  if (app2) {
    const defs = db.getDeficienciesByApplicationId(app2.id).filter(
      (d) => (d.documentId === doc.id || d.linkedField === doc.docType) && d.status !== "Resolved"
    );
    for (const d of defs) {
      d.status = "Resolved";
      d.resolvedAt = (/* @__PURE__ */ new Date()).toISOString();
      d.resolutionRemarks = "Resolved upon document verification.";
      d.history.push({
        id: `hist_${Date.now()}`,
        action: "Deficiency Resolved",
        actorName: user.fullName,
        actorRole: user.role,
        remarks: "Document verified satisfactory.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      db.saveDeficiency(d);
    }
  }
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "VERIFY_DOCUMENT",
    entityType: "Document",
    entityId: doc.id,
    previousValue: { verificationStatus: prev.verificationStatus },
    newValue: { verificationStatus: "Verified", remarks: doc.verificationRemarks },
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "Document marked as Verified.", document: doc });
});
documentsRouter.post("/:id/reject", authenticate, (req, res) => {
  const user = req.user;
  if (user.role === "applicant") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only officers can reject documents." } });
  }
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: { code: "REASON_REQUIRED", message: "Rejection reason is required." } });
  }
  const doc = db.findDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document not found." } });
  }
  const prev = { ...doc };
  doc.verificationStatus = "Rejected";
  doc.verificationRemarks = reason;
  doc.verifiedBy = user.fullName;
  doc.verifiedAt = (/* @__PURE__ */ new Date()).toISOString();
  doc.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveDocument(doc);
  const app2 = db.findApplicationById(doc.applicationId);
  if (app2) {
    app2.status = "Deficient";
    db.saveApplication(app2);
    const defId = `def_${Date.now()}_${doc.id}`;
    db.saveDeficiency({
      id: defId,
      applicationId: app2.id,
      documentId: doc.id,
      category: "Document Mismatch",
      title: `Rejected Document: ${doc.title}`,
      description: reason,
      linkedField: doc.docType,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      status: "Open",
      raisedBy: user.fullName,
      raisedAt: (/* @__PURE__ */ new Date()).toISOString(),
      history: [
        {
          id: `hist_${Date.now()}`,
          action: "Document Rejected & Deficiency Raised",
          actorName: user.fullName,
          actorRole: user.role,
          remarks: reason,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      ]
    });
    const applicantUser = db.findUserByEmail(app2.applicantEmail);
    if (applicantUser) {
      db.addNotification({
        id: `notif_${Date.now()}`,
        userId: applicantUser.id,
        title: `Document Rejected: ${doc.title}`,
        message: `Your uploaded document ${doc.title} was rejected by verification officer. Reason: ${reason}. Please resubmit.`,
        type: "danger",
        relatedApplicationId: app2.id,
        linkUrl: `/applicant/deficiencies`,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "REJECT_DOCUMENT",
    entityType: "Document",
    entityId: doc.id,
    previousValue: { verificationStatus: prev.verificationStatus },
    newValue: { verificationStatus: "Rejected", remarks: reason },
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "Document marked as Rejected and deficiency raised.", document: doc });
});
documentsRouter.post("/:id/clarify", authenticate, (req, res) => {
  const user = req.user;
  if (user.role === "applicant") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only officers can request clarification." } });
  }
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: { code: "REASON_REQUIRED", message: "Clarification details are required." } });
  }
  const doc = db.findDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document not found." } });
  }
  doc.verificationStatus = "Needs Clarification";
  doc.verificationRemarks = reason;
  doc.verifiedBy = user.fullName;
  doc.verifiedAt = (/* @__PURE__ */ new Date()).toISOString();
  doc.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveDocument(doc);
  const app2 = db.findApplicationById(doc.applicationId);
  if (app2) {
    const applicantUser = db.findUserByEmail(app2.applicantEmail);
    if (applicantUser) {
      db.addNotification({
        id: `notif_${Date.now()}`,
        userId: applicantUser.id,
        title: `Clarification Requested: ${doc.title}`,
        message: `Officer requested clarification regarding ${doc.title}: ${reason}`,
        type: "warning",
        relatedApplicationId: app2.id,
        linkUrl: `/applicant/applications/${app2.id}`,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "REQUEST_DOCUMENT_CLARIFICATION",
    entityType: "Document",
    entityId: doc.id,
    newValue: { verificationStatus: "Needs Clarification", remarks: reason },
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "Clarification requested.", document: doc });
});
documentsRouter.put("/:id/extraction", authenticate, (req, res) => {
  const user = req.user;
  if (user.role === "applicant") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Applicants cannot edit OCR extractions." } });
  }
  const doc = db.findDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document not found." } });
  }
  const prev = doc.extractedData;
  doc.extractedData = {
    ...doc.extractedData || { provider: "demo", extractedAt: (/* @__PURE__ */ new Date()).toISOString() },
    ...req.body
  };
  doc.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveDocument(doc);
  const app2 = db.findApplicationById(doc.applicationId);
  if (app2) {
    const allDocs = db.getDocumentsByApplicationId(app2.id);
    const consistency = ConsistencyEngine.evaluate(app2, allDocs);
    db.saveConsistency(app2.id, consistency);
    app2.consistencyScore = consistency.score;
    app2.riskLevel = consistency.riskLevel;
    db.saveApplication(app2);
  }
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "OVERRIDE_OCR_EXTRACTION",
    entityType: "Document",
    entityId: doc.id,
    previousValue: prev,
    newValue: doc.extractedData,
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "Extracted values updated successfully.", document: doc });
});
documentsRouter.get("/:id/file", authenticate, (req, res) => {
  const doc = db.findDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).send("Document not found");
  }
  if (fs4.existsSync(doc.filePath)) {
    return res.sendFile(path3.resolve(doc.filePath));
  } else {
    res.setHeader("Content-Type", "text/plain");
    return res.send(`PROTOTYPE DOCUMENT PREVIEW:

Document Title: ${doc.title}
Original File: ${doc.originalFileName}
Status: ${doc.verificationStatus}
Extracted Fields: ${JSON.stringify(doc.extractedData, null, 2)}`);
  }
});

// backend/routes/deficiencies.ts
import { Router as Router5 } from "express";
var deficienciesRouter = Router5();
deficienciesRouter.get("/", authenticate, (req, res) => {
  const user = req.user;
  const { applicationId } = req.query;
  let defs = db.getAllDeficiencies();
  if (applicationId) {
    defs = defs.filter((d) => d.applicationId === applicationId);
  } else if (user.role === "applicant") {
    const profile = db.findApplicantByUserId(user.id);
    const myAppIds = new Set(
      db.getApplications().filter((a) => a.applicantId === profile?.id || a.applicantEmail === user.email).map((a) => a.id)
    );
    defs = defs.filter((d) => myAppIds.has(d.applicationId));
  }
  res.json(defs);
});
deficienciesRouter.post("/", authenticate, (req, res) => {
  const user = req.user;
  if (user.role === "applicant") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only officers can raise deficiencies." } });
  }
  const { applicationId, documentId, category, title, description, linkedField, dueDate } = req.body;
  if (!applicationId || !title || !description) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Title, description and application ID are required." } });
  }
  const app2 = db.findApplicationById(applicationId);
  if (!app2) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
  }
  const defId = `def_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const newDef = {
    id: defId,
    applicationId: app2.id,
    documentId,
    category: category || "Clarification Required",
    title,
    description,
    linkedField,
    dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    status: "Open",
    raisedBy: user.fullName,
    raisedAt: (/* @__PURE__ */ new Date()).toISOString(),
    history: [
      {
        id: `hist_${Date.now()}`,
        action: "Deficiency Raised",
        actorName: user.fullName,
        actorRole: user.role,
        remarks: description,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]
  };
  db.saveDeficiency(newDef);
  app2.status = "Deficient";
  app2.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveApplication(app2);
  const applicantUser = db.findUserByEmail(app2.applicantEmail);
  if (applicantUser) {
    db.addNotification({
      id: `notif_${Date.now()}`,
      userId: applicantUser.id,
      title: `Deficiency Raised: ${title}`,
      message: `Officer ${user.fullName} raised a deficiency on your application ${app2.applicationNumber}: ${description}. Due: ${newDef.dueDate}`,
      type: "warning",
      relatedApplicationId: app2.id,
      linkUrl: `/applicant/deficiencies`,
      isRead: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "RAISE_DEFICIENCY",
    entityType: "Deficiency",
    entityId: newDef.id,
    newValue: newDef,
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.status(201).json({ message: "Deficiency raised successfully.", deficiency: newDef });
});
deficienciesRouter.post("/:id/resubmit", authenticate, (req, res) => {
  const user = req.user;
  const def = db.findDeficiencyById(req.params.id);
  if (!def) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Deficiency not found." } });
  }
  const { remarks, correctedValue } = req.body;
  def.status = "Resubmitted";
  def.history.push({
    id: `hist_${Date.now()}`,
    action: "Resolution Submitted",
    actorName: user.fullName,
    actorRole: user.role,
    remarks: remarks || "Applicant uploaded updated document or corrected details.",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (def.linkedField && correctedValue !== void 0) {
    const app2 = db.findApplicationById(def.applicationId);
    if (app2) {
      app2.data = { ...app2.data || {}, [def.linkedField]: correctedValue };
      app2.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
      db.saveApplication(app2);
    }
  }
  db.saveDeficiency(def);
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "RESUBMIT_DEFICIENCY",
    entityType: "Deficiency",
    entityId: def.id,
    newValue: { remarks, correctedValue },
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "Deficiency resolution submitted for officer review.", deficiency: def });
});
deficienciesRouter.post("/:id/resolve", authenticate, (req, res) => {
  const user = req.user;
  if (user.role === "applicant") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only officers can resolve deficiencies." } });
  }
  const def = db.findDeficiencyById(req.params.id);
  if (!def) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Deficiency not found." } });
  }
  const remarks = req.body.remarks || "Accepted resolution as satisfactory.";
  def.status = "Resolved";
  def.resolvedAt = (/* @__PURE__ */ new Date()).toISOString();
  def.resolutionRemarks = remarks;
  def.history.push({
    id: `hist_${Date.now()}`,
    action: "Deficiency Resolved & Accepted",
    actorName: user.fullName,
    actorRole: user.role,
    remarks,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  db.saveDeficiency(def);
  const app2 = db.findApplicationById(def.applicationId);
  if (app2) {
    const remainingOpen = db.getDeficienciesByApplicationId(app2.id).filter((d) => d.status !== "Resolved");
    if (remainingOpen.length === 0 && app2.status === "Deficient") {
      app2.status = "Under Verification";
      app2.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
      db.saveApplication(app2);
    }
    const applicantUser = db.findUserByEmail(app2.applicantEmail);
    if (applicantUser) {
      db.addNotification({
        id: `notif_${Date.now()}`,
        userId: applicantUser.id,
        title: `Deficiency Resolved: ${def.title}`,
        message: `Officer ${user.fullName} accepted your deficiency resolution.`,
        type: "success",
        relatedApplicationId: app2.id,
        linkUrl: `/applicant/applications/${app2.id}`,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "RESOLVE_DEFICIENCY",
    entityType: "Deficiency",
    entityId: def.id,
    newValue: { status: "Resolved", remarks },
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "Deficiency marked as Resolved.", deficiency: def });
});
deficienciesRouter.post("/:id/reject", authenticate, (req, res) => {
  const user = req.user;
  if (user.role === "applicant") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only officers can reject deficiency resolutions." } });
  }
  const def = db.findDeficiencyById(req.params.id);
  if (!def) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Deficiency not found." } });
  }
  const { remarks } = req.body;
  if (!remarks) {
    return res.status(400).json({ error: { code: "REMARKS_REQUIRED", message: "Clarification / rejection remarks are required." } });
  }
  def.status = "Open";
  def.history.push({
    id: `hist_${Date.now()}`,
    action: "Resolution Rejected (Further Clarification Required)",
    actorName: user.fullName,
    actorRole: user.role,
    remarks,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  db.saveDeficiency(def);
  const app2 = db.findApplicationById(def.applicationId);
  if (app2) {
    app2.status = "Deficient";
    db.saveApplication(app2);
    const applicantUser = db.findUserByEmail(app2.applicantEmail);
    if (applicantUser) {
      db.addNotification({
        id: `notif_${Date.now()}`,
        userId: applicantUser.id,
        title: `Further Clarification Needed: ${def.title}`,
        message: `Officer noted your resolution is insufficient: ${remarks}. Please upload valid evidence.`,
        type: "danger",
        relatedApplicationId: app2.id,
        linkUrl: `/applicant/deficiencies`,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "REJECT_DEFICIENCY_RESOLUTION",
    entityType: "Deficiency",
    entityId: def.id,
    newValue: { status: "Open", remarks },
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "Resolution rejected, deficiency returned to Open status.", deficiency: def });
});

// backend/routes/screening.ts
import { Router as Router6 } from "express";
var screeningRouter = Router6();
screeningRouter.get("/", authenticate, requireRole(["officer", "selection", "admin"]), (req, res) => {
  const { schemeId, state, riskLevel, minMarks, sort = "score" } = req.query;
  let apps = db.getApplications();
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
  const enrichedCandidates = apps.map((app2) => {
    const scheme = db.findSchemeById(app2.schemeId);
    const docs = db.getDocumentsByApplicationId(app2.id);
    const consistency = db.getConsistency(app2.id);
    const selection = db.findSelectionByApplicationId(app2.id);
    const criteria = scheme?.selectionCriteria || [];
    let totalScore = 0;
    const breakdown = {};
    const rawMarks = Number(app2.data?.postgraduatePercentage || app2.data?.marksPercentage || 70);
    const verifiedDocs = docs.filter((d) => d.verificationStatus === "Verified").length;
    const totalDocs = docs.length || 1;
    for (const c of criteria) {
      let scoreVal = 0;
      if (c.sourceType === "academic") {
        scoreVal = Math.min(c.weight, rawMarks / 100 * c.weight);
      } else if (c.sourceType === "research") {
        const hasTopic = !!app2.data?.researchTopic || !!app2.data?.foreignUniversity;
        scoreVal = hasTopic ? c.weight * 0.9 : c.weight * 0.5;
      } else if (c.sourceType === "verification") {
        scoreVal = verifiedDocs / totalDocs * c.weight;
      } else if (c.sourceType === "risk_penalty") {
        const cScore = consistency?.score ?? (app2.consistencyScore ?? 85);
        scoreVal = cScore / 100 * c.weight;
      }
      breakdown[c.code] = Math.round(scoreVal * 10) / 10;
      totalScore += scoreVal;
    }
    totalScore = Math.round(totalScore * 10) / 10;
    let aiRecommendation = "Needs review";
    let aiRecommendationReason = "";
    if (totalScore >= 75 && (app2.consistencyScore ?? 100) >= 80 && app2.eligibilityStatus !== "Ineligible") {
      aiRecommendation = "Recommend shortlist";
      aiRecommendationReason = `Merit score ${totalScore}/100 exceeds cutoff. Document integrity is high (${app2.consistencyScore}%).`;
    } else if (app2.eligibilityStatus === "Ineligible" || (app2.consistencyScore ?? 100) < 60) {
      aiRecommendation = "Not recommended";
      aiRecommendationReason = "Ineligible thresholds or high severity document inconsistencies detected.";
    } else {
      aiRecommendation = "Needs review";
      aiRecommendationReason = "Moderate score or document scrutiny pending.";
    }
    return {
      applicationId: app2.id,
      applicationNumber: app2.applicationNumber,
      applicantName: app2.applicantName,
      schemeId: app2.schemeId,
      schemeCode: scheme?.code || "NFST",
      status: app2.status,
      currentStage: app2.currentStage,
      eligibilityStatus: app2.eligibilityStatus || "Requires review",
      consistencyScore: app2.consistencyScore ?? (consistency?.score || 80),
      riskLevel: app2.riskLevel || "LOW",
      academicMarks: rawMarks,
      state: app2.data?.state || "Jharkhand",
      screeningScore: selection?.screeningScore ?? totalScore,
      scoreBreakdown: selection?.scoreBreakdown ?? breakdown,
      aiRecommendation: selection?.aiRecommendation ?? aiRecommendation,
      aiRecommendationReason: selection?.aiRecommendationReason ?? aiRecommendationReason,
      officerDecision: selection?.officerDecision ?? (app2.officerDecision || "Pending"),
      officerRemarks: selection?.officerRemarks ?? (app2.officerRemarks || ""),
      finalizedAt: selection?.finalizedAt ?? app2.finalizedAt
    };
  });
  if (sort === "score") {
    enrichedCandidates.sort((a, b) => b.screeningScore - a.screeningScore);
  } else if (sort === "marks") {
    enrichedCandidates.sort((a, b) => b.academicMarks - a.academicMarks);
  }
  const allApps = db.getApplications();
  const stats = {
    totalApplications: allApps.length,
    eligible: allApps.filter((a) => a.eligibilityStatus === "Eligible").length,
    ineligible: allApps.filter((a) => a.eligibilityStatus === "Ineligible").length,
    pendingVerification: allApps.filter((a) => a.status === "Submitted" || a.status === "Under Verification").length,
    deficient: allApps.filter((a) => a.status === "Deficient").length,
    highRisk: allApps.filter((a) => a.riskLevel === "HIGH").length,
    shortlisted: allApps.filter((a) => a.status === "Shortlisted").length,
    selected: allApps.filter((a) => a.status === "Selected").length,
    rejected: allApps.filter((a) => a.status === "Ineligible" || a.officerDecision === "Reject").length
  };
  res.json({
    stats,
    candidates: enrichedCandidates,
    fairnessNote: {
      message: "Scores are computed strictly on academic merit, research relevance, document scrutiny completeness, and objective consistency. Demographic variables (gender, religion, personal names) are strictly excluded from ranking algorithms.",
      consideredFields: ["Qualifying marks percentage", "Research proposal synopsis", "Statutory document verification status", "Document consistency and integrity score"]
    }
  });
});

// backend/routes/selection.ts
import { Router as Router7 } from "express";
var selectionRouter = Router7();
selectionRouter.post("/decision", authenticate, requireRole(["selection", "admin", "officer"]), (req, res) => {
  const user = req.user;
  const { applicationId, decision, remarks, screeningScore, scoreBreakdown, aiRecommendation, aiRecommendationReason } = req.body;
  if (!applicationId || !decision) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Application ID and decision are required." } });
  }
  if (decision === "Reject" && (!remarks || !remarks.trim())) {
    return res.status(400).json({ error: { code: "REASON_REQUIRED", message: "Rejection decision requires an official recorded reason." } });
  }
  const app2 = db.findApplicationById(applicationId);
  if (!app2) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
  }
  let selection = db.findSelectionByApplicationId(app2.id);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (!selection) {
    selection = {
      id: `sel_${Date.now()}_${app2.id}`,
      applicationId: app2.id,
      schemeId: app2.schemeId,
      applicantId: app2.applicantId,
      applicantName: app2.applicantName,
      screeningScore: screeningScore || app2.screeningScore || 80,
      scoreBreakdown: scoreBreakdown || {},
      aiRecommendation: aiRecommendation || "Recommend shortlist",
      aiRecommendationReason: aiRecommendationReason || "Based on merit criteria evaluation.",
      officerDecision: decision,
      officerRemarks: remarks,
      finalizedBy: user.fullName,
      finalizedAt: now,
      createdAt: now
    };
  } else {
    selection.officerDecision = decision;
    selection.officerRemarks = remarks;
    selection.finalizedBy = user.fullName;
    selection.finalizedAt = now;
  }
  db.saveSelectionRecord(selection);
  app2.officerDecision = decision;
  app2.officerRemarks = remarks;
  app2.lastUpdatedAt = now;
  if (decision === "Shortlist") {
    app2.status = "Shortlisted";
    app2.currentStage = "SCREENING";
  } else if (decision === "Select") {
    app2.status = "Selected";
    app2.currentStage = "POST_SELECTION";
    app2.finalizedAt = now;
    app2.postSelectionStatus = "Pending Submission";
    let postSel = db.findPostSelectionByApplicationId(app2.id);
    if (!postSel) {
      postSel = {
        id: `post_sel_${app2.id}`,
        applicationId: app2.id,
        schemeId: app2.schemeId,
        applicantId: app2.applicantId,
        applicantName: app2.applicantName,
        awardAmount: app2.schemeId === "scheme_nos" ? "100% Tuition Fees + Living Allowance (\xA39,900 / $15,400 per annum)" : "\u20B931,000 / month + HRA & Annual Contingency \u20B920,000",
        durationYears: app2.schemeId === "scheme_nos" ? 2 : 5,
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
        joiningStatus: "Pending Submission",
        requiredDocuments: [
          { code: "joining_report", title: "Department Joining Report signed by Head of Institution", submitted: false, verified: false },
          { code: "undertaking_bond", title: "Fellowship Undertaking Bond on Stamp Paper", submitted: false, verified: false },
          { code: "mandate_form", title: "PFMS Bank Mandate Form with Branch Seal", submitted: false, verified: false }
        ],
        updatedAt: now
      };
      db.savePostSelectionRecord(postSel);
    }
  } else if (decision === "Reject") {
    app2.status = "Not Selected";
  }
  db.saveApplication(app2);
  const applicantUser = db.findUserByEmail(app2.applicantEmail);
  if (applicantUser) {
    db.addNotification({
      id: `notif_${Date.now()}`,
      userId: applicantUser.id,
      title: `Selection Decision: ${app2.applicationNumber}`,
      message: decision === "Select" ? `Congratulations! You have been provisionally selected for the ${app2.schemeId.toUpperCase()} fellowship. Please check Post-Selection.` : decision === "Shortlist" ? `Your application ${app2.applicationNumber} has been shortlisted by the Selection Committee.` : `Official decision recorded for ${app2.applicationNumber}: ${decision}. Remarks: ${remarks || ""}`,
      type: decision === "Select" ? "success" : decision === "Reject" ? "danger" : "info",
      relatedApplicationId: app2.id,
      linkUrl: decision === "Select" ? "/applicant/post-selection" : `/applicant/applications/${app2.id}`,
      isRead: false,
      createdAt: now
    });
  }
  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "OFFICER_SELECTION_DECISION",
    entityType: "SelectionRecord",
    entityId: selection.id,
    newValue: { decision, remarks, applicant: app2.applicantName },
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({
    message: `Selection decision "${decision}" recorded successfully.`,
    selection,
    application: app2
  });
});
selectionRouter.get("/export-csv", authenticate, (req, res) => {
  const { schemeId } = req.query;
  let apps = db.getApplications().filter((a) => a.status === "Selected" || a.officerDecision === "Select" || a.status === "Shortlisted");
  if (schemeId) {
    apps = apps.filter((a) => a.schemeId === schemeId);
  }
  const csvRows = [
    ["Application Number", "Applicant Name", "Scheme", "State", "Category", "Academic Marks %", "Screening Score", "Status", "Decision", "Officer Remarks", "Finalized Date"]
  ];
  for (const a of apps) {
    const sel = db.findSelectionByApplicationId(a.id);
    csvRows.push([
      `"${a.applicationNumber}"`,
      `"${a.applicantName}"`,
      `"${a.schemeId.toUpperCase()}"`,
      `"${a.data?.state || ""}"`,
      `"ST"`,
      `"${a.data?.postgraduatePercentage || a.data?.marksPercentage || ""}"`,
      `"${sel?.screeningScore ?? a.screeningScore ?? ""}"`,
      `"${a.status}"`,
      `"${a.officerDecision || "Selected"}"`,
      `"${(a.officerRemarks || "").replace(/"/g, '""')}"`,
      `"${a.finalizedAt || ""}"`
    ]);
  }
  const csvString = csvRows.map((r) => r.join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="selection_list_${Date.now()}.csv"`);
  return res.send(csvString);
});

// backend/routes/postSelection.ts
import { Router as Router8 } from "express";
var postSelectionRouter = Router8();
postSelectionRouter.get("/", authenticate, (req, res) => {
  const user = req.user;
  const { applicationId } = req.query;
  let targetAppId = applicationId ? String(applicationId) : void 0;
  if (!targetAppId && user.role === "applicant") {
    const profile = db.findApplicantByUserId(user.id);
    const selectedApp = db.getApplications().find((a) => (a.applicantId === profile?.id || a.applicantEmail === user.email) && (a.status === "Selected" || a.currentStage === "POST_SELECTION"));
    targetAppId = selectedApp?.id;
  }
  if (!targetAppId) {
    if (user.role !== "applicant") {
      const allRecords = db.getPostSelectionRecords();
      return res.json(allRecords);
    }
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "No active post-selection record found." } });
  }
  const record = db.findPostSelectionByApplicationId(targetAppId);
  const progressRecords = db.getProgressRecordsByApplicationId(targetAppId);
  const app2 = db.findApplicationById(targetAppId);
  return res.json({
    record,
    progressRecords,
    application: app2,
    disclaimer: "Disbursement: Direct Benefit Transfer (DBT) execution via PFMS is outside the administrative scope of this prototype."
  });
});
postSelectionRouter.post("/submit-doc", authenticate, (req, res) => {
  const { applicationId, docCode, title } = req.body;
  if (!applicationId || !docCode) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Application ID and docCode are required." } });
  }
  let postSel = db.findPostSelectionByApplicationId(applicationId);
  if (!postSel) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Post-selection record not found." } });
  }
  const docItem = postSel.requiredDocuments.find((d) => d.code === docCode);
  if (docItem) {
    docItem.submitted = true;
    docItem.remarks = "Uploaded by fellow, awaiting verification.";
  } else {
    postSel.requiredDocuments.push({
      code: docCode,
      title: title || docCode,
      submitted: true,
      verified: false,
      remarks: "Uploaded by fellow."
    });
  }
  postSel.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.savePostSelectionRecord(postSel);
  return res.json({ message: "Document submitted for post-selection verification.", record: postSel });
});
postSelectionRouter.post("/verify-doc", authenticate, (req, res) => {
  const user = req.user;
  if (user.role === "applicant") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only officers can verify post-selection documents." } });
  }
  const { applicationId, docCode, verified = true, remarks } = req.body;
  const postSel = db.findPostSelectionByApplicationId(applicationId);
  if (!postSel) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Post-selection record not found." } });
  }
  const docItem = postSel.requiredDocuments.find((d) => d.code === docCode);
  if (docItem) {
    docItem.verified = verified;
    docItem.remarks = remarks || (verified ? "Verified authentic." : "Verification rejected.");
  }
  const allVerified = postSel.requiredDocuments.every((d) => d.verified);
  if (allVerified) {
    postSel.joiningStatus = "Active Fellow";
  }
  postSel.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.savePostSelectionRecord(postSel);
  return res.json({ message: "Post-selection document verification saved.", record: postSel });
});
postSelectionRouter.post("/progress", authenticate, (req, res) => {
  const { applicationId, semesterOrYear, progressTitle, researchSummary, supervisorRemarks } = req.body;
  if (!applicationId || !semesterOrYear || !researchSummary) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Missing progress submission fields." } });
  }
  const newProg = {
    id: `prog_${Date.now()}`,
    applicationId,
    semesterOrYear,
    progressTitle: progressTitle || "Semester Progress Report",
    researchSummary,
    supervisorRemarks: supervisorRemarks || "Research work recommended for continuation.",
    officerApprovalStatus: "Pending",
    submittedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.saveProgressRecord(newProg);
  return res.status(201).json({ message: "Progress report submitted for officer review.", progressRecord: newProg });
});
postSelectionRouter.post("/progress/:id/approval", authenticate, (req, res) => {
  const user = req.user;
  if (user.role === "applicant") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only officers can approve progress records." } });
  }
  const { status, remarks } = req.body;
  const allProg = db.getData().progressRecords;
  const record = allProg.find((p) => p.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Progress record not found." } });
  }
  record.officerApprovalStatus = status || "Approved";
  record.officerRemarks = remarks || "Approved for fellowship continuation.";
  record.approvedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveProgressRecord(record);
  return res.json({ message: `Progress record ${record.officerApprovalStatus}.`, progressRecord: record });
});

// backend/routes/notifications.ts
import { Router as Router9 } from "express";
var notificationsRouter = Router9();
notificationsRouter.get("/", authenticate, (req, res) => {
  const user = req.user;
  const notifs = db.getNotificationsByUserId(user.id);
  const unreadCount = notifs.filter((n) => !n.isRead).length;
  res.json({
    notifications: notifs,
    unreadCount
  });
});
notificationsRouter.post("/:id/read", authenticate, (req, res) => {
  const user = req.user;
  db.markNotificationAsRead(req.params.id, user.id);
  res.json({ message: "Marked as read." });
});
notificationsRouter.post("/read-all", authenticate, (req, res) => {
  const user = req.user;
  db.markAllNotificationsAsRead(user.id);
  res.json({ message: "All notifications marked as read." });
});

// backend/routes/communications.ts
import { Router as Router10 } from "express";
var communicationsRouter = Router10();
communicationsRouter.get("/:applicationId", authenticate, (req, res) => {
  const comms = db.getCommunicationsByApplicationId(req.params.applicationId);
  res.json(comms);
});
communicationsRouter.post("/", authenticate, (req, res) => {
  const user = req.user;
  const { applicationId, recipientId, recipientName, recipientRole, message, linkedDeficiencyId } = req.body;
  if (!applicationId || !message || !message.trim()) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Application ID and message are required." } });
  }
  const app2 = db.findApplicationById(applicationId);
  if (!app2) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
  }
  let finalRecipientId = recipientId;
  let finalRecipientName = recipientName;
  let finalRecipientRole = recipientRole;
  if (!finalRecipientId) {
    if (user.role === "applicant") {
      finalRecipientRole = "officer";
      finalRecipientName = "Verification Desk";
      finalRecipientId = "usr_officer_0";
    } else {
      const applicantUser = db.findUserByEmail(app2.applicantEmail);
      finalRecipientId = applicantUser?.id || app2.applicantId;
      finalRecipientName = app2.applicantName;
      finalRecipientRole = "applicant";
    }
  }
  const comm = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    applicationId: app2.id,
    senderId: user.id,
    senderName: user.fullName,
    senderRole: user.role,
    recipientId: finalRecipientId,
    recipientName: finalRecipientName,
    recipientRole: finalRecipientRole,
    message: message.trim(),
    linkedDeficiencyId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.addCommunication(comm);
  if (finalRecipientId) {
    db.addNotification({
      id: `notif_${Date.now()}`,
      userId: finalRecipientId,
      title: `New Message regarding ${app2.applicationNumber}`,
      message: `${user.fullName} (${user.role}): "${message.slice(0, 80)}${message.length > 80 ? "..." : ""}"`,
      type: "info",
      relatedApplicationId: app2.id,
      linkUrl: user.role === "applicant" ? `/officer/applications/${app2.id}` : `/applicant/communication`,
      isRead: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return res.status(201).json({ message: "Message sent successfully.", communication: comm });
});

// backend/routes/analytics.ts
import { Router as Router11 } from "express";
var analyticsRouter = Router11();
analyticsRouter.get("/dashboard", authenticate, requireRole(["officer", "selection", "admin"]), (req, res) => {
  const { scheme, state } = req.query;
  let apps = db.getApplications();
  if (scheme) {
    apps = apps.filter((a) => a.schemeId === scheme);
  }
  if (state) {
    apps = apps.filter((a) => a.data?.state === state);
  }
  const total = apps.length;
  const pending = apps.filter((a) => a.status === "Submitted" || a.status === "Under Verification").length;
  const deficient = apps.filter((a) => a.status === "Deficient").length;
  const eligible = apps.filter((a) => a.status === "Eligible").length;
  const ineligible = apps.filter((a) => a.status === "Ineligible" || a.eligibilityStatus === "Ineligible").length;
  const shortlisted = apps.filter((a) => a.status === "Shortlisted").length;
  const selected = apps.filter((a) => a.status === "Selected").length;
  const rejected = apps.filter((a) => a.status === "Not Selected" || a.officerDecision === "Reject").length;
  const byScheme = [
    { name: "NFST (Fellowship)", count: apps.filter((a) => a.schemeId === "scheme_nfst").length, code: "NFST" },
    { name: "NOS (Overseas)", count: apps.filter((a) => a.schemeId === "scheme_nos").length, code: "NOS" }
  ];
  const stateCounts = {};
  for (const a of apps) {
    const st = a.data?.state || "Other";
    stateCounts[st] = (stateCounts[st] || 0) + 1;
  }
  const byState = Object.entries(stateCounts).map(([state2, count]) => ({ state: state2, count })).sort((a, b) => b.count - a.count);
  const statusDist = [
    { status: "Submitted", count: apps.filter((a) => a.status === "Submitted").length, fill: "#3B82F6" },
    { status: "Under Verification", count: apps.filter((a) => a.status === "Under Verification").length, fill: "#F59E0B" },
    { status: "Deficient", count: apps.filter((a) => a.status === "Deficient").length, fill: "#EA580C" },
    { status: "Eligible", count: apps.filter((a) => a.status === "Eligible").length, fill: "#10B981" },
    { status: "Shortlisted", count: apps.filter((a) => a.status === "Shortlisted").length, fill: "#8B5CF6" },
    { status: "Selected", count: apps.filter((a) => a.status === "Selected").length, fill: "#059669" },
    { status: "Ineligible / Rejected", count: apps.filter((a) => a.status === "Ineligible" || a.status === "Not Selected").length, fill: "#EF4444" }
  ];
  const riskDist = [
    { name: "LOW Risk (>=85%)", count: apps.filter((a) => a.riskLevel === "LOW").length, fill: "#16A34A" },
    { name: "MEDIUM Risk (60-84%)", count: apps.filter((a) => a.riskLevel === "MEDIUM").length, fill: "#D97706" },
    { name: "HIGH Risk (<60%)", count: apps.filter((a) => a.riskLevel === "HIGH").length, fill: "#DC2626" }
  ];
  const defs = db.getAllDeficiencies();
  const defCategoryMap = {};
  for (const d of defs) {
    defCategoryMap[d.category] = (defCategoryMap[d.category] || 0) + 1;
  }
  const deficiencyCategories = Object.entries(defCategoryMap).map(([category, count]) => ({ category, count }));
  const processingTimeDays = [
    { stage: "Document Scrutiny", days: 2.4, targetDays: 3 },
    { stage: "Deficiency Resolution", days: 4.8, targetDays: 7 },
    { stage: "Eligibility Review", days: 1.2, targetDays: 2 },
    { stage: "Screening & Merit", days: 3.5, targetDays: 5 },
    { stage: "Final Selection", days: 2.1, targetDays: 4 }
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
      rejected
    },
    byScheme,
    byState,
    statusDist,
    riskDist,
    deficiencyCategories,
    processingTimeDays
  });
});

// backend/routes/reports.ts
import { Router as Router12 } from "express";
var reportsRouter = Router12();
reportsRouter.get("/:type", authenticate, requireRole(["officer", "selection", "admin"]), (req, res) => {
  const { type } = req.params;
  const { scheme, state } = req.query;
  let apps = db.getApplications();
  if (scheme) apps = apps.filter((a) => a.schemeId === scheme);
  if (state) apps = apps.filter((a) => a.data?.state === state);
  if (type === "applications-summary") {
    const data = apps.map((a) => ({
      applicationNumber: a.applicationNumber,
      applicantName: a.applicantName,
      scheme: a.schemeId.toUpperCase(),
      state: a.data?.state || "Jharkhand",
      submissionDate: a.submittedAt || a.createdAt,
      status: a.status,
      stage: a.currentStage,
      consistencyScore: a.consistencyScore || 80,
      riskLevel: a.riskLevel || "LOW"
    }));
    return res.json({ title: "Application Summary Report", totalRecords: data.length, records: data });
  }
  if (type === "eligibility-report") {
    const data = apps.map((a) => {
      const elig = db.getEligibility(a.id);
      return {
        applicationNumber: a.applicationNumber,
        applicantName: a.applicantName,
        scheme: a.schemeId.toUpperCase(),
        overallEligibility: a.eligibilityStatus || "Requires review",
        criteriaSatisfied: elig ? elig.criteriaResults.filter((c) => c.status === "PASS").length : 0,
        totalCriteria: elig ? elig.criteriaResults.length : 0,
        evaluatedAt: elig?.evaluatedAt || a.lastUpdatedAt
      };
    });
    return res.json({ title: "Statutory Eligibility Verification Report", totalRecords: data.length, records: data });
  }
  if (type === "document-verification") {
    const allDocs = db.getData().documents;
    const data = allDocs.map((d) => {
      const app2 = db.findApplicationById(d.applicationId);
      return {
        applicationNumber: app2?.applicationNumber || "N/A",
        applicantName: app2?.applicantName || "N/A",
        documentTitle: d.title,
        docType: d.docType,
        verificationStatus: d.verificationStatus,
        verifiedBy: d.verifiedBy || "Pending",
        verifiedAt: d.verifiedAt || "Pending",
        extractedName: d.extractedData?.name || "N/A",
        certificateNumber: d.extractedData?.certificateNumber || "N/A"
      };
    });
    return res.json({ title: "Document Scrutiny and Verification Report", totalRecords: data.length, records: data });
  }
  if (type === "deficiencies") {
    const defs = db.getAllDeficiencies();
    const data = defs.map((d) => {
      const app2 = db.findApplicationById(d.applicationId);
      return {
        applicationNumber: app2?.applicationNumber || "N/A",
        applicantName: app2?.applicantName || "N/A",
        deficiencyTitle: d.title,
        category: d.category,
        status: d.status,
        dueDate: d.dueDate,
        raisedBy: d.raisedBy,
        raisedAt: d.raisedAt,
        resolvedAt: d.resolvedAt || "N/A"
      };
    });
    return res.json({ title: "Deficiency Tracking and Resolution Report", totalRecords: data.length, records: data });
  }
  if (type === "selection") {
    const sels = db.getSelectionRecords();
    const data = sels.map((s) => {
      const app2 = db.findApplicationById(s.applicationId);
      return {
        applicationNumber: app2?.applicationNumber || s.applicationId,
        applicantName: s.applicantName,
        scheme: s.schemeId.toUpperCase(),
        screeningScore: s.screeningScore,
        aiRecommendation: s.aiRecommendation,
        officerDecision: s.officerDecision,
        finalizedBy: s.finalizedBy || "Pending",
        finalizedAt: s.finalizedAt || "Pending"
      };
    });
    return res.json({ title: "Merit Selection & Award List Report", totalRecords: data.length, records: data });
  }
  return res.status(400).json({ error: { code: "INVALID_REPORT_TYPE", message: "Unknown report type" } });
});
reportsRouter.get("/:type/csv", authenticate, requireRole(["officer", "selection", "admin"]), (req, res) => {
  const { type } = req.params;
  const apps = db.getApplications();
  let csvContent = "";
  if (type === "applications-summary") {
    csvContent = "Application Number,Applicant Name,Scheme,State,Status,Stage,Consistency Score,Risk Level\n" + apps.map((a) => `"${a.applicationNumber}","${a.applicantName}","${a.schemeId.toUpperCase()}","${a.data?.state || ""}","${a.status}","${a.currentStage}","${a.consistencyScore || 80}","${a.riskLevel || "LOW"}"`).join("\n");
  } else if (type === "deficiencies") {
    const defs = db.getAllDeficiencies();
    csvContent = "Deficiency Title,Application Number,Category,Status,Due Date,Raised By,Raised At,Resolved At\n" + defs.map((d) => `"${d.title}","${d.applicationId}","${d.category}","${d.status}","${d.dueDate}","${d.raisedBy}","${d.raisedAt}","${d.resolvedAt || ""}"`).join("\n");
  } else {
    csvContent = "Application Number,Applicant Name,Scheme,Status,Screening Score,Officer Decision\n" + apps.map((a) => `"${a.applicationNumber}","${a.applicantName}","${a.schemeId.toUpperCase()}","${a.status}","${a.screeningScore || ""}","${a.officerDecision || ""}"`).join("\n");
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${type}_report_${Date.now()}.csv"`);
  return res.send(csvContent);
});

// backend/routes/auditLogs.ts
import { Router as Router13 } from "express";
var auditLogsRouter = Router13();
auditLogsRouter.get("/", authenticate, requireRole(["admin", "officer"]), (req, res) => {
  const { action, userEmail, entityType, search } = req.query;
  let logs = db.getAuditLogs();
  if (action) {
    logs = logs.filter((l) => l.action === action);
  }
  if (userEmail) {
    logs = logs.filter((l) => l.userEmail.toLowerCase().includes(String(userEmail).toLowerCase()));
  }
  if (entityType) {
    logs = logs.filter((l) => l.entityType === entityType);
  }
  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter(
      (l) => l.action.toLowerCase().includes(q) || l.userEmail.toLowerCase().includes(q) || l.entityId.toLowerCase().includes(q)
    );
  }
  res.json(logs);
});
auditLogsRouter.get("/export-csv", authenticate, requireRole(["admin"]), (req, res) => {
  const logs = db.getAuditLogs();
  const header = ["Timestamp", "User Email", "Role", "Action", "Entity Type", "Entity ID", "IP Address", "New Value"];
  const rows = logs.map((l) => [
    `"${l.timestamp}"`,
    `"${l.userEmail}"`,
    `"${l.userRole}"`,
    `"${l.action}"`,
    `"${l.entityType}"`,
    `"${l.entityId}"`,
    `"${l.ipAddress}"`,
    `"${JSON.stringify(l.newValue || "").replace(/"/g, '""')}"`
  ]);
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="audit_logs_${Date.now()}.csv"`);
  return res.send(csv);
});

// backend/routes/ai.ts
import { Router as Router14 } from "express";

// backend/ai/aiAssistantService.ts
var AiAssistantService = class {
  static async query(userQuery, userRole) {
    const q = userQuery.trim().toLowerCase();
    const appMatch = userQuery.match(/(?:NFST|NOS|APP|SCH)[-_A-Z0-9]+/i) || userQuery.match(/app_[a-z0-9_]+/i);
    let appNumber = appMatch ? appMatch[0].toUpperCase() : void 0;
    let targetApp = appNumber ? db.findApplicationById(appNumber) : void 0;
    if (!targetApp && appNumber) {
      targetApp = db.getApplications().find(
        (a) => a.applicationNumber.toLowerCase().includes(appNumber.toLowerCase()) || a.id.toLowerCase() === appNumber.toLowerCase()
      );
    }
    if (q.includes("how many") || q.includes("count") || q.includes("total applications") || q.includes("summary statistics")) {
      const apps = db.getApplications();
      const pendingVer = apps.filter((a) => a.status === "Submitted" || a.status === "Under Verification").length;
      const deficient = apps.filter((a) => a.status === "Deficient").length;
      const eligible = apps.filter((a) => a.status === "Eligible" || a.status === "Shortlisted" || a.status === "Selected").length;
      const highRisk = apps.filter((a) => a.riskLevel === "HIGH").length;
      return {
        answer: `Currently in the system, there are **${apps.length} total applications** across NFST and NOS schemes. Breakdown:
- **${pendingVer} applications** are pending document scrutiny / under verification.
- **${deficient} applications** have open deficiencies awaiting applicant resubmission.
- **${eligible} applications** are verified eligible or proceeding through screening.
- **${highRisk} applications** are flagged with HIGH risk advisory alerts requiring priority scrutiny.`,
        sources: ["database:applications", "audit_logs"],
        suggestedQuestions: [
          "Show high-risk applications",
          "Which applications are deficient?",
          "What are the primary causes for deficiency?"
        ],
        isAiEnhanced: false
      };
    }
    if (q.includes("high risk") || q.includes("flagged applications")) {
      const highRiskApps = db.getApplications().filter((a) => a.riskLevel === "HIGH");
      const list = highRiskApps.map(
        (a) => `- **${a.applicationNumber}** (${a.applicantName}) - Scheme: ${a.schemeId.toUpperCase()}, Consistency: ${a.consistencyScore}%, Status: ${a.status}`
      ).join("\n");
      return {
        answer: `There are **${highRiskApps.length} applications** categorized with HIGH risk advisory findings:

${list}

*Recommendation: Open these records in the 3-Column Review page to review the specific certificate inconsistencies.*`,
        sources: ["database:applications", "consistency_results"],
        suggestedQuestions: highRiskApps.slice(0, 3).map((a) => `Why was ${a.applicationNumber} flagged?`),
        isAiEnhanced: false
      };
    }
    if (targetApp) {
      const docs = db.getDocumentsByApplicationId(targetApp.id);
      const consistency = db.getConsistency(targetApp.id);
      const eligibility = db.getEligibility(targetApp.id);
      const deficiencies = db.getDeficienciesByApplicationId(targetApp.id);
      if (q.includes("why") || q.includes("flag") || q.includes("pending") || q.includes("inconsistent") || q.includes("issue")) {
        let text = `### Analysis for Application **${targetApp.applicationNumber}** (${targetApp.applicantName}):

`;
        text += `- **Current Status**: ${targetApp.status} (Stage: ${targetApp.currentStage})
`;
        text += `- **Consistency Score**: ${targetApp.consistencyScore ?? (consistency?.score || "N/A")}% (Advisory Risk: **${targetApp.riskLevel || "LOW"}**)
`;
        if (deficiencies.filter((d) => d.status !== "Resolved").length > 0) {
          text += `
**Open Deficiencies (${deficiencies.filter((d) => d.status !== "Resolved").length}):**
`;
          deficiencies.filter((d) => d.status !== "Resolved").forEach((d) => {
            text += `- **${d.title}**: ${d.description} (Due: ${d.dueDate}, Status: ${d.status})
`;
          });
        }
        if (consistency && consistency.findings.length > 0) {
          const warningsOrFails = consistency.findings.filter((f) => f.status === "FAIL" || f.status === "WARNING");
          if (warningsOrFails.length > 0) {
            text += `
**Key Automated Inconsistencies:**
`;
            warningsOrFails.forEach((f) => {
              text += `- **[${f.status}] ${f.title}**: ${f.details}
`;
            });
          }
        }
        if (eligibility) {
          const failedRules = eligibility.criteriaResults.filter((c) => c.status === "FAIL");
          if (failedRules.length > 0) {
            text += `
**Failed Eligibility Criteria:**
`;
            failedRules.forEach((r) => {
              text += `- ${r.criterion}: ${r.evidence} (Action: ${r.recommendedAction})
`;
            });
          }
        }
        return {
          answer: text,
          sources: ["eligibility_results", "document_checks", "deficiencies"],
          suggestedQuestions: [
            `What documents are missing for ${targetApp.applicationNumber}?`,
            `How was the consistency score calculated for ${targetApp.applicationNumber}?`,
            `What is the officer recommendation for ${targetApp.applicationNumber}?`
          ],
          relatedApplicationId: targetApp.id,
          isAiEnhanced: false
        };
      }
      if (q.includes("missing") || q.includes("document")) {
        const scheme = db.findSchemeById(targetApp.schemeId);
        const reqDocs = scheme?.requiredDocuments || [];
        const uploadedTypes = new Set(docs.map((d) => d.docType));
        const missing = reqDocs.filter((r) => r.mandatory && !uploadedTypes.has(r.code));
        if (missing.length === 0) {
          return {
            answer: `All mandatory documents for **${targetApp.applicationNumber}** have been uploaded (${docs.length} documents on file). Verification status: ${docs.filter((d) => d.verificationStatus === "Verified").length} Verified, ${docs.filter((d) => d.verificationStatus === "Pending").length} Pending Scrutiny.`,
            sources: ["scheme_documents", "application_documents"],
            suggestedQuestions: [`Why was ${targetApp.applicationNumber} flagged?`],
            relatedApplicationId: targetApp.id,
            isAiEnhanced: false
          };
        } else {
          return {
            answer: `Application **${targetApp.applicationNumber}** is missing **${missing.length} mandatory document(s)**:
` + missing.map((m) => `- **${m.title}** (${m.code}): ${m.description}`).join("\n"),
            sources: ["scheme_documents", "application_documents", "deficiencies"],
            suggestedQuestions: [
              `Raise deficiency for ${targetApp.applicationNumber}`,
              `Check consistency for ${targetApp.applicationNumber}`
            ],
            relatedApplicationId: targetApp.id,
            isAiEnhanced: false
          };
        }
      }
    }
    return {
      answer: `I can assist you with application investigations, document verification analysis, deficiency tracking, and screening queries.
You can ask:
- *"Why is application NFST-2025-003 pending?"*
- *"What documents are missing for NOS-2025-002?"*
- *"Show all high-risk applications"*
- *"How many applications are pending document verification?"*
- *"Which eligibility criteria failed for NOS-2025-009?"*`,
      sources: ["system_knowledge"],
      suggestedQuestions: [
        "Why is application NFST-2025-003 pending?",
        "What documents are missing for NOS-2025-002?",
        "Show all high-risk applications",
        "How many applications are pending document verification?"
      ],
      isAiEnhanced: false
    };
  }
};

// backend/routes/ai.ts
var aiRouter = Router14();
aiRouter.post("/query", authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: { code: "EMPTY_QUERY", message: "Query string is required." } });
    }
    const response = await AiAssistantService.query(query, user.role);
    return res.json(response);
  } catch (err) {
    return res.status(500).json({
      error: { code: "AI_QUERY_ERROR", message: err.message || "AI assistant query processing failed." }
    });
  }
});

// backend/routes/users.ts
import { Router as Router15 } from "express";
import bcrypt3 from "bcryptjs";
var usersRouter = Router15();
usersRouter.get("/", authenticate, requireRole(["admin"]), (req, res) => {
  const users = db.getData().users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    fullName: u.fullName,
    mobile: u.mobile,
    active: u.active,
    createdAt: u.createdAt
  }));
  res.json(users);
});
usersRouter.put("/:id", authenticate, requireRole(["admin"]), (req, res) => {
  const user = db.findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found." } });
  }
  const { role, active, fullName, mobile } = req.body;
  const prev = { ...user };
  if (role) user.role = role;
  if (active !== void 0) user.active = active;
  if (fullName) user.fullName = fullName;
  if (mobile) user.mobile = mobile;
  db.saveUser(user);
  db.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: "ADMIN_UPDATE_USER",
    entityType: "User",
    entityId: user.id,
    previousValue: prev,
    newValue: user,
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "User updated successfully.", user });
});
usersRouter.post("/:id/reset-password", authenticate, requireRole(["admin"]), (req, res) => {
  const user = db.findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found." } });
  }
  const newPassword = req.body.password || "Demo@123";
  const salt = bcrypt3.genSaltSync(10);
  user.passwordHash = bcrypt3.hashSync(newPassword, salt);
  db.saveUser(user);
  db.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: "ADMIN_RESET_PASSWORD",
    entityType: "User",
    entityId: user.id,
    newValue: { status: "Password reset" },
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: `Password reset to "${newPassword}" successfully.` });
});

// backend/routes/demo.ts
import { Router as Router16 } from "express";
var demoRouter = Router16();
demoRouter.post("/reset", authenticate, async (req, res) => {
  try {
    await runDatabaseSeed(true);
    db.addAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email || "admin@demo.com",
      userRole: req.user?.role || "admin",
      action: "DEMO_DATA_RESET",
      entityType: "System",
      entityId: "ALL",
      newValue: { message: "Database reset to default demo scenario state." },
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({
      message: "Demo database has been successfully reset to default scenario state with 11 demo applications."
    });
  } catch (err) {
    return res.status(500).json({ error: { code: "RESET_FAILED", message: err.message } });
  }
});
demoRouter.get("/sample-documents", (req, res) => {
  const library = [
    {
      docType: "st_certificate",
      title: "Scheduled Tribe Certificate",
      scenarios: [
        { code: "matching", label: "Matching Certificate (Consistent name & details)", sampleFile: "sample_st_cert_matching.pdf" },
        { code: "mismatch_name", label: 'Name Formatting Variation ("Rahul K." instead of "Rahul Kumar")', sampleFile: "sample_st_cert_mismatch_name.pdf" },
        { code: "mismatch_dob", label: "Date of Birth Mismatch (1998-05-21 vs 1998-05-12)", sampleFile: "sample_st_cert_mismatch_dob.pdf" }
      ]
    },
    {
      docType: "income_certificate",
      title: "Annual Family Income Certificate",
      scenarios: [
        { code: "valid", label: "Valid Income Certificate (FY 2024-25, within ceiling)", sampleFile: "sample_income_cert_valid.pdf" },
        { code: "expired", label: "Expired Income Certificate (Expired on 2023-03-31)", sampleFile: "sample_income_cert_expired.pdf" }
      ]
    },
    {
      docType: "passport",
      title: "Valid Indian Passport (NOS)",
      scenarios: [
        { code: "valid", label: "Valid Passport (Z4829104, Expiry 2031)", sampleFile: "sample_passport_valid.pdf" }
      ]
    },
    {
      docType: "admission_letter",
      title: "Admission / Enrolment Letter",
      scenarios: [
        { code: "valid", label: "Confirmed Ph.D. Enrolment Letter (Delhi University)", sampleFile: "sample_admission_letter.pdf" }
      ]
    },
    {
      docType: "degree_certificate",
      title: "Postgraduate Marksheet / Degree Certificate",
      scenarios: [
        { code: "valid", label: "Qualifying Postgraduate Marksheet (74.5% First Class)", sampleFile: "sample_marksheet_pg.pdf" }
      ]
    },
    {
      docType: "research_proposal",
      title: "Research Proposal Synopsis",
      scenarios: [
        { code: "valid", label: "Research Synopsis (Ethnobotanical Traditions of Santhal Community)", sampleFile: "sample_research_proposal.pdf" }
      ]
    }
  ];
  res.json(library);
});

// server-dev.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path4.dirname(__filename);
dotenv.config();
var app = express();
var PORT = parseInt(process.env.PORT || "3000", 10);
var isProduction = process.env.NODE_ENV === "production";
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
var uploadsDir = path4.resolve(process.env.UPLOAD_DIR || "./uploads");
if (!fs5.existsSync(uploadsDir)) {
  fs5.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/api/auth", authRouter);
app.use("/api/schemes", schemesRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/deficiencies", deficienciesRouter);
app.use("/api/screening", screeningRouter);
app.use("/api/selection", selectionRouter);
app.use("/api/post-selection", postSelectionRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/communications", communicationsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/audit-logs", auditLogsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/users", usersRouter);
app.use("/api/demo", demoRouter);
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    system: "Tribal Scholarship & Fellowship Portal (MoTA)",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
async function startServer() {
  await runDatabaseSeed(false);
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path4.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path4.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tribal Scholarship Portal server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
