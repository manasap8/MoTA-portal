export type UserRole = 'applicant' | 'officer' | 'selection' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  fullName: string;
  mobile: string;
  active: boolean;
  createdAt: string;
}

export interface ApplicantProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  mobile: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  state: string;
  district: string;
  category: 'ST';
  stCertNumber: string;
  stCertAuthority: string;
  stCertDate: string;
  qualification: string;
  annualIncome: number;
  address: string;
  pincode: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  profileCompleted: boolean;
  updatedAt: string;
}

export interface FormFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'file';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  validationRule?: string;
}

export interface FormSectionConfig {
  key: string;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
}

export interface RequiredDocumentConfig {
  id: string;
  code: string;
  title: string;
  description: string;
  mandatory: boolean;
  allowedFormats: string[];
  maxSizeMB: number;
  sampleFileName?: string;
}

export type RuleOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'contains'
  | 'documentExists'
  | 'documentVerified';

export interface SchemeRule {
  id: string;
  criterion: string;
  type: 'required' | 'optional' | 'advisory';
  targetType: 'field' | 'document';
  targetKey: string;
  operator: RuleOperator;
  expectedValue: any;
  weight: number;
  failMessage: string;
  evidenceSource: string;
}

export interface SelectionCriterion {
  id: string;
  code: string;
  label: string;
  description: string;
  weight: number; // percentage or points
  sourceType: 'academic' | 'qualification' | 'research' | 'verification' | 'risk_penalty';
}

export interface WorkflowStage {
  id: string;
  order: number;
  code: string;
  name: string;
  description: string;
  assignedRole: UserRole;
}

export interface Scheme {
  id: string;
  code: string;
  name: string;
  fullName: string;
  description: string;
  applicationStart: string;
  applicationEnd: string;
  active: boolean;
  totalSeats: number;
  academicYear: string;
  formSections: FormSectionConfig[];
  requiredDocuments: RequiredDocumentConfig[];
  eligibilityRules: SchemeRule[];
  selectionCriteria: SelectionCriterion[];
  workflowStages: WorkflowStage[];
}

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Verification'
  | 'Deficient'
  | 'Eligible'
  | 'Ineligible'
  | 'Shortlisted'
  | 'Selected'
  | 'Not Selected'
  | 'Post-Selection';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ConsistencyFinding {
  id: string;
  category: string;
  field: string;
  status: 'PASS' | 'WARNING' | 'FAIL' | 'INFO';
  title: string;
  message: string;
  details: string;
  weightDeduction: number;
  isAiAssisted: boolean;
}

export interface ConsistencyResult {
  score: number; // 0 to 100
  riskLevel: RiskLevel;
  findings: ConsistencyFinding[];
  scoreBreakdown: {
    nameMatching: number;
    dobMatching: number;
    categoryCert: number;
    institution: number;
    course: number;
    validityExpiry: number;
    completeness: number;
  };
  plainExplanation: string;
}

export interface CriterionEvaluationResult {
  criterionId: string;
  criterion: string;
  type: 'required' | 'optional' | 'advisory';
  status: 'PASS' | 'FAIL' | 'PENDING' | 'REQUIRES_REVIEW';
  evidence: string;
  fieldUsed?: string;
  supportingDocType?: string;
  conflictDetected?: string;
  recommendedAction: string;
}

export interface EligibilityResult {
  applicationId: string;
  overallStatus: 'Eligible' | 'Eligible subject to pending verification' | 'Ineligible' | 'Requires review';
  criteriaResults: CriterionEvaluationResult[];
  explanation: string;
  officerOverride?: {
    overriddenBy: string;
    overriddenAt: string;
    originalStatus: string;
    newStatus: string;
    reason: string;
  };
  evaluatedAt: string;
}

export interface Application {
  id: string;
  applicationNumber: string;
  schemeId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  status: ApplicationStatus;
  currentStage: string;
  createdAt: string;
  submittedAt?: string;
  lastUpdatedAt: string;
  data: Record<string, any>;
  consistencyScore?: number;
  riskLevel?: RiskLevel;
  eligibilityStatus?: string;
  screeningScore?: number;
  officerDecision?: 'Pending' | 'Shortlist' | 'Reject' | 'Hold' | 'Select';
  officerRemarks?: string;
  finalizedAt?: string;
  postSelectionStatus?: string;
}

export type DocumentFileStatus = 'Uploaded' | 'Processing' | 'Processed' | 'Failed';
export type DocumentVerificationStatus = 'Pending' | 'Verified' | 'Rejected' | 'Needs Clarification';

export interface ExtractedFields {
  name?: string;
  fatherName?: string;
  dob?: string;
  certificateNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  institution?: string;
  course?: string;
  marksPercentage?: number;
  annualIncome?: number;
  category?: string;
  passportNumber?: string;
  pageCount?: number;
  confidenceScores?: Record<string, number>;
  rawNotes?: string;
  provider: 'gemini' | 'demo';
  extractedAt: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  schemeDocId: string;
  docType: string;
  title: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileStatus: DocumentFileStatus;
  verificationStatus: DocumentVerificationStatus;
  verificationRemarks?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  version: number;
  extractedData?: ExtractedFields;
  isSampleDoc?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DeficiencyStatus = 'Open' | 'Resubmitted' | 'Under Review' | 'Resolved' | 'Rejected';

export interface DeficiencyHistoryItem {
  id: string;
  action: string;
  actorName: string;
  actorRole: string;
  remarks: string;
  documentVersion?: number;
  createdAt: string;
}

export interface Deficiency {
  id: string;
  applicationId: string;
  documentId?: string;
  category: 'Missing Document' | 'Document Mismatch' | 'Expired Certificate' | 'Incomplete Field' | 'Clarification Required';
  title: string;
  description: string;
  linkedField?: string;
  dueDate: string;
  status: DeficiencyStatus;
  raisedBy: string;
  raisedAt: string;
  resolvedAt?: string;
  resolutionRemarks?: string;
  resubmittedDocumentId?: string;
  history: DeficiencyHistoryItem[];
}

export interface SelectionRecord {
  id: string;
  applicationId: string;
  schemeId: string;
  applicantId: string;
  applicantName: string;
  screeningScore: number;
  scoreBreakdown: Record<string, number>;
  aiRecommendation: 'Recommend shortlist' | 'Needs review' | 'Not recommended';
  aiRecommendationReason: string;
  officerDecision: 'Pending' | 'Shortlist' | 'Reject' | 'Hold' | 'Select';
  officerRemarks?: string;
  finalizedBy?: string;
  finalizedAt?: string;
  createdAt: string;
}

export interface PostSelectionRecord {
  id: string;
  applicationId: string;
  schemeId: string;
  applicantId: string;
  applicantName: string;
  awardAmount: string;
  durationYears: number;
  startDate: string;
  joiningStatus: 'Pending Submission' | 'Submitted' | 'Verified' | 'Active Fellow';
  requiredDocuments: {
    code: string;
    title: string;
    submitted: boolean;
    verified: boolean;
    docId?: string;
    remarks?: string;
  }[];
  remarks?: string;
  updatedAt: string;
}

export interface ProgressRecord {
  id: string;
  applicationId: string;
  semesterOrYear: string;
  progressTitle: string;
  researchSummary: string;
  supervisorRemarks: string;
  progressReportDocId?: string;
  officerApprovalStatus: 'Pending' | 'Approved' | 'Rejected';
  officerRemarks?: string;
  submittedAt: string;
  approvedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  relatedApplicationId?: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Communication {
  id: string;
  applicationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  recipientRole: UserRole;
  message: string;
  linkedDeficiencyId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: any;
  newValue?: any;
  ipAddress: string;
  timestamp: string;
}
