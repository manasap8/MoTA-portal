import initialData from '../data/initialData.json';
import {
  User,
  ApplicantProfile,
  Scheme,
  Application,
  ApplicationDocument,
  Deficiency,
  EligibilityResult,
  ConsistencyResult,
  SelectionRecord,
  PostSelectionRecord,
  ProgressRecord,
  Notification,
  Communication,
  AuditLog,
} from '../types';

interface DatabaseSchema {
  users: User[];
  applicants: ApplicantProfile[];
  schemes: Scheme[];
  applications: Application[];
  documents: ApplicationDocument[];
  deficiencies: Deficiency[];
  eligibilityResults: EligibilityResult[];
  consistencyResults: ConsistencyResult[];
  selectionRecords: SelectionRecord[];
  postSelectionRecords: PostSelectionRecord[];
  progressRecords: ProgressRecord[];
  notifications: Notification[];
  communications: Communication[];
  auditLogs: AuditLog[];
}

const STORAGE_KEY = 'mota_tribal_portal_db_v1';

class ClientDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseSchema {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse localStorage data:', e);
    }
    // Default to initial seed
    const initial = JSON.parse(JSON.stringify(initialData)) as DatabaseSchema;
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(data: DatabaseSchema) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to write to localStorage:', e);
    }
  }

  private persist() {
    this.saveToStorage(this.data);
  }

  public resetToDefault(): DatabaseSchema {
    const initial = JSON.parse(JSON.stringify(initialData)) as DatabaseSchema;
    this.data = initial;
    this.saveToStorage(initial);
    return this.data;
  }

  // --- Auth Methods ---
  public login(email: string, password?: string): { token: string; user: User; applicantProfile?: ApplicantProfile } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.data.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (!user.active) {
      throw new Error('Account is deactivated. Contact administrator.');
    }

    // For demo purposes and client fallback, accept any non-empty password or Demo@123
    const token = `demo_jwt_token_${user.id}_${Date.now()}`;
    const profile = user.role === 'applicant' ? this.data.applicants.find((a) => a.userId === user.id) : undefined;

    return {
      token,
      user,
      applicantProfile: profile,
    };
  }

  public register(body: any): { token: string; user: User } {
    const cleanEmail = body.email.trim().toLowerCase();
    const existing = this.data.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const userId = `usr_app_${Date.now()}`;
    const newUser: User = {
      id: userId,
      email: body.email,
      role: 'applicant',
      fullName: body.fullName,
      mobile: body.mobile || '9876543210',
    };

    const newProfile: ApplicantProfile = {
      id: `ap_${Date.now()}`,
      userId,
      dob: body.dob || '2000-01-01',
      gender: body.gender || 'Other',
      category: body.category || 'ST',
      subTribe: body.subTribe || 'Santhal',
      isPvtg: !!body.isPvtg,
      pvtgGroup: body.pvtgGroup,
      annualFamilyIncome: Number(body.annualFamilyIncome) || 300000,
      stateOfDomicile: body.stateOfDomicile || 'Jharkhand',
      district: body.district || 'Ranchi',
      disabilityStatus: !!body.disabilityStatus,
      disabilityPercentage: body.disabilityPercentage ? Number(body.disabilityPercentage) : undefined,
      bankDetails: {
        accountHolderName: body.fullName,
        accountNumber: 'XXXXXX' + Math.floor(1000 + Math.random() * 9000),
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India',
        branch: 'Main Branch',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.data.applicants.push(newProfile);
    this.persist();

    const token = `demo_jwt_token_${userId}_${Date.now()}`;
    return { token, user: newUser };
  }

  public getMe(tokenOrUserEmail?: string): { user: User; applicantProfile?: ApplicantProfile } {
    let user: User | undefined;
    if (tokenOrUserEmail && tokenOrUserEmail.startsWith('demo_jwt_token_')) {
      const parts = tokenOrUserEmail.split('_');
      const userId = parts[3];
      user = this.data.users.find((u) => u.id === userId);
    }

    if (!user) {
      // Fallback to first applicant or demo user
      user = this.data.users[0];
    }

    const profile = user.role === 'applicant' ? this.data.applicants.find((a) => a.userId === user?.id) : undefined;
    return { user, applicantProfile: profile };
  }

  public updateProfile(profileData: any): { applicantProfile: ApplicantProfile } {
    let profile = this.data.applicants.find((p) => p.userId === profileData.userId || p.id === profileData.id);
    if (!profile) {
      profile = this.data.applicants[0];
    }
    Object.assign(profile, profileData, { updatedAt: new Date().toISOString() });
    this.persist();
    return { applicantProfile: profile };
  }

  // --- Schemes ---
  public getSchemes(): Scheme[] {
    return this.data.schemes;
  }

  public getSchemeById(id: string): Scheme | undefined {
    return this.data.schemes.find((s) => s.id === id || s.code.toLowerCase() === id.toLowerCase());
  }

  public updateScheme(id: string, body: any): Scheme {
    const s = this.getSchemeById(id);
    if (s) {
      Object.assign(s, body, { updatedAt: new Date().toISOString() });
      this.persist();
      return s;
    }
    throw new Error('Scheme not found');
  }

  // --- Applications ---
  public getApplications(params?: Record<string, string>): Application[] {
    let list = [...this.data.applications];
    if (params?.applicantId) {
      list = list.filter((a) => a.applicantId === params.applicantId);
    }
    if (params?.schemeId) {
      list = list.filter((a) => a.schemeId === params.schemeId);
    }
    if (params?.status) {
      list = list.filter((a) => a.status === params.status);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.applicationNumber.toLowerCase().includes(s) ||
          a.applicantName.toLowerCase().includes(s) ||
          a.applicantEmail.toLowerCase().includes(s)
      );
    }
    return list;
  }

  public getApplicationById(id: string) {
    const application = this.data.applications.find((a) => a.id === id || a.applicationNumber === id);
    if (!application) return null;

    const scheme = this.data.schemes.find((s) => s.id === application.schemeId);
    const documents = this.data.documents.filter((d) => d.applicationId === application.id);
    const deficiencies = this.data.deficiencies.filter((d) => d.applicationId === application.id);
    const eligibilityResult = this.data.eligibilityResults.find((e) => e.applicationId === application.id);
    const consistencyResult = this.data.consistencyResults.find((c) => c.score !== undefined); // default or matching
    const communications = this.data.communications.filter((c) => c.applicationId === application.id);
    const auditLogs = this.data.auditLogs.filter((a) => a.entityId === application.id);

    return {
      application,
      scheme,
      documents,
      deficiencies,
      eligibilityResult,
      consistencyResult,
      communications,
      auditLogs,
    };
  }

  public createApplication(body: any): Application {
    const appCount = this.data.applications.length + 1;
    const year = new Date().getFullYear();
    const schemeCode = body.schemeId === 'scheme_nos' ? 'NOS' : 'NFST';
    const appNumber = `${schemeCode}-${year}-${String(appCount).padStart(4, '0')}`;

    const newApp: Application = {
      id: `app_${Date.now()}`,
      applicationNumber: appNumber,
      schemeId: body.schemeId,
      applicantId: body.applicantId || 'usr_applicant_0',
      applicantName: body.applicantName || 'Applicant',
      applicantEmail: body.applicantEmail || 'applicant@demo.com',
      status: 'Draft',
      currentStage: 'Application Draft',
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      data: body.data || {},
    };

    this.data.applications.unshift(newApp);
    this.persist();
    return newApp;
  }

  public updateApplication(id: string, body: any): Application {
    const app = this.data.applications.find((a) => a.id === id);
    if (!app) throw new Error('Application not found');
    app.data = { ...(app.data || {}), ...(body.data || body) };
    app.lastUpdatedAt = new Date().toISOString();
    this.persist();
    return app;
  }

  public submitApplication(id: string): Application {
    const app = this.data.applications.find((a) => a.id === id);
    if (!app) throw new Error('Application not found');
    app.status = 'Submitted';
    app.currentStage = 'Verification Pending';
    app.submittedAt = new Date().toISOString();
    app.lastUpdatedAt = new Date().toISOString();
    this.persist();
    return app;
  }

  public transitionStage(id: string, stage: string, status?: string): Application {
    const app = this.data.applications.find((a) => a.id === id);
    if (!app) throw new Error('Application not found');
    app.currentStage = stage;
    if (status) app.status = status as any;
    app.lastUpdatedAt = new Date().toISOString();
    this.persist();
    return app;
  }

  // --- Documents ---
  public attachSampleDoc(body: any): ApplicationDocument {
    const docId = `doc_${Date.now()}`;
    const newDoc: ApplicationDocument = {
      id: docId,
      applicationId: body.applicationId,
      schemeDocId: body.schemeDocId || 'doc_unknown',
      docType: body.docType || 'certificate',
      title: body.title || 'Attached Document',
      fileName: body.fileName || 'sample_document.pdf',
      filePath: `/uploads/${body.fileName || 'sample.pdf'}`,
      fileSize: 450000,
      mimeType: 'application/pdf',
      fileStatus: 'Processed',
      verificationStatus: 'Pending',
      version: 1,
      isSampleDoc: true,
      extractedData: {
        name: body.extractedData?.name || 'Rahul Kumar Soren',
        dob: body.extractedData?.dob || '1998-05-20',
        certificateNumber: body.extractedData?.certificateNumber || 'ST/JH/2023/88492',
        institution: body.extractedData?.institution || 'Delhi University',
        course: body.extractedData?.course || 'Ph.D. in Tribal Studies',
        category: body.extractedData?.category || 'ST',
        annualIncome: body.extractedData?.annualIncome || 320000,
        provider: 'demo',
        extractedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.documents.push(newDoc);
    this.persist();
    return newDoc;
  }

  public verifyDoc(id: string, remarks?: string): ApplicationDocument {
    const doc = this.data.documents.find((d) => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.verificationStatus = 'Verified';
    doc.verificationRemarks = remarks || 'Verified against submitted criteria';
    doc.verifiedAt = new Date().toISOString();
    doc.verifiedBy = 'Dr. Anita Meena';
    this.persist();
    return doc;
  }

  public rejectDoc(id: string, reason: string): ApplicationDocument {
    const doc = this.data.documents.find((d) => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.verificationStatus = 'Rejected';
    doc.verificationRemarks = reason;
    this.persist();
    return doc;
  }

  public clarifyDoc(id: string, reason: string): ApplicationDocument {
    const doc = this.data.documents.find((d) => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.verificationStatus = 'Needs Clarification';
    doc.verificationRemarks = reason;
    this.persist();
    return doc;
  }

  public editExtraction(id: string, data: any): ApplicationDocument {
    const doc = this.data.documents.find((d) => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.extractedData = { ...(doc.extractedData || {}), ...data, provider: 'demo', extractedAt: new Date().toISOString() };
    this.persist();
    return doc;
  }

  // --- Deficiencies ---
  public getDeficiencies(applicationId?: string): Deficiency[] {
    if (applicationId) {
      return this.data.deficiencies.filter((d) => d.applicationId === applicationId);
    }
    return this.data.deficiencies;
  }

  public raiseDeficiency(body: any): Deficiency {
    const defId = `def_${Date.now()}`;
    const newDef: Deficiency = {
      id: defId,
      applicationId: body.applicationId,
      documentId: body.documentId,
      category: body.category || 'Document Discrepancy',
      title: body.title,
      description: body.description,
      linkedField: body.linkedField,
      dueDate: body.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'Open',
      raisedBy: 'Dr. Anita Meena (Verification Officer)',
      raisedAt: new Date().toISOString(),
      history: [
        {
          id: `dh_${Date.now()}`,
          action: 'RAISED',
          actorName: 'Dr. Anita Meena',
          actorRole: 'Verification Officer',
          remarks: body.description,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    this.data.deficiencies.unshift(newDef);

    // Update application status to Deficient
    const app = this.data.applications.find((a) => a.id === body.applicationId);
    if (app) {
      app.status = 'Deficient';
      app.currentStage = 'Deficiency Raised';
    }

    this.persist();
    return newDef;
  }

  public resubmitDeficiency(id: string, body: any): Deficiency {
    const def = this.data.deficiencies.find((d) => d.id === id);
    if (!def) throw new Error('Deficiency not found');

    def.status = 'Resubmitted';
    def.history.push({
      id: `dh_${Date.now()}`,
      action: 'RESUBMITTED',
      actorName: 'Applicant',
      actorRole: 'applicant',
      remarks: body.remarks || 'Updated certificate provided.',
      createdAt: new Date().toISOString(),
    });

    const app = this.data.applications.find((a) => a.id === def.applicationId);
    if (app) {
      app.status = 'Under Verification';
      app.currentStage = 'Verification Pending';
    }

    this.persist();
    return def;
  }

  public resolveDeficiency(id: string, remarks?: string): Deficiency {
    const def = this.data.deficiencies.find((d) => d.id === id);
    if (!def) throw new Error('Deficiency not found');

    def.status = 'Resolved';
    def.resolvedAt = new Date().toISOString();
    def.resolutionRemarks = remarks || 'Accepted upon review';
    def.history.push({
      id: `dh_${Date.now()}`,
      action: 'RESOLVED',
      actorName: 'Dr. Anita Meena',
      actorRole: 'officer',
      remarks: remarks || 'Resolved',
      createdAt: new Date().toISOString(),
    });

    this.persist();
    return def;
  }

  public rejectResolution(id: string, remarks: string): Deficiency {
    const def = this.data.deficiencies.find((d) => d.id === id);
    if (!def) throw new Error('Deficiency not found');

    def.status = 'Open';
    def.history.push({
      id: `dh_${Date.now()}`,
      action: 'REJECTED_RESOLUTION',
      actorName: 'Dr. Anita Meena',
      actorRole: 'officer',
      remarks: remarks,
      createdAt: new Date().toISOString(),
    });

    this.persist();
    return def;
  }

  // --- Screening & Selection ---
  public getScreeningData(params?: Record<string, string>) {
    let apps = [...this.data.applications];
    if (params?.schemeId) {
      apps = apps.filter((a) => a.schemeId === params.schemeId);
    }

    const totalApplications = apps.length;
    const eligibleCount = apps.filter((a) => a.status === 'Eligible' || (a.screeningScore && a.screeningScore >= 75)).length;
    const shortlistedCount = apps.filter((a) => a.officerDecision === 'Shortlist').length;
    const selectedCount = apps.filter((a) => a.status === 'Selected' || a.officerDecision === 'Select').length;

    const candidates = apps.map((app) => {
      const score = app.screeningScore || Math.floor(65 + Math.random() * 30);
      return {
        id: app.id,
        applicationNumber: app.applicationNumber,
        schemeId: app.schemeId,
        applicantName: app.applicantName,
        status: app.status,
        screeningScore: score,
        scoreBreakdown: {
          academicMarks: Math.floor(score * 0.4),
          qsUniversityRank: Math.floor(score * 0.3),
          researchProposal: Math.floor(score * 0.2),
          pvtgVulnerability: Math.floor(score * 0.1),
        },
        aiRecommendation: score >= 80 ? 'Recommend shortlist' : score >= 65 ? 'Needs review' : 'Not recommended',
        aiRecommendationReason: `Academic excellence and documentation verified with composite score ${score}/100.`,
        officerDecision: app.officerDecision || 'Pending',
        riskLevel: app.riskLevel || (score >= 80 ? 'LOW' : score >= 65 ? 'MEDIUM' : 'HIGH'),
      };
    });

    return {
      stats: {
        totalApplications,
        eligibleCount,
        shortlistedCount,
        selectedCount,
        seatQuotaTotal: 750,
        quotaUtilized: selectedCount,
      },
      candidates,
    };
  }

  public saveSelectionDecision(body: any): SelectionRecord {
    const recId = `sel_${Date.now()}`;
    const record: SelectionRecord = {
      id: recId,
      applicationId: body.applicationId,
      schemeId: body.schemeId || 'scheme_nfst',
      applicantId: body.applicantId || 'usr_applicant_0',
      applicantName: body.applicantName || 'Applicant',
      screeningScore: body.screeningScore || 85,
      scoreBreakdown: {},
      aiRecommendation: 'Recommend shortlist',
      aiRecommendationReason: 'Eligible with high merit score',
      officerDecision: body.decision,
      officerRemarks: body.remarks,
      finalizedBy: 'Shri Rajesh Gond (Selection Officer)',
      finalizedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const app = this.data.applications.find((a) => a.id === body.applicationId);
    if (app) {
      app.officerDecision = body.decision;
      app.officerRemarks = body.remarks;
      if (body.decision === 'Select') {
        app.status = 'Selected';
        app.currentStage = 'Post-Selection';
      } else if (body.decision === 'Reject') {
        app.status = 'Rejected';
      }
    }

    this.data.selectionRecords.push(record);
    this.persist();
    return record;
  }

  // --- Post-Selection ---
  public getPostSelection(applicationId?: string) {
    let record = this.data.postSelectionRecords[0];
    if (applicationId) {
      const match = this.data.postSelectionRecords.find((p) => p.applicationId === applicationId);
      if (match) record = match;
    }
    const app = this.data.applications.find((a) => a.id === record?.applicationId) || this.data.applications[0];
    const progressRecords = this.data.progressRecords.filter((p) => p.applicationId === app?.id);

    return {
      record,
      application: app,
      progressRecords,
    };
  }

  public submitProgress(body: any): ProgressRecord {
    const newProg: ProgressRecord = {
      id: `pr_${Date.now()}`,
      applicationId: body.applicationId || 'app_demo_01',
      semesterOrYear: body.semesterOrYear,
      progressTitle: body.progressTitle,
      researchSummary: body.researchSummary,
      supervisorRemarks: body.supervisorRemarks,
      officerApprovalStatus: 'Pending',
      submittedAt: new Date().toISOString(),
    };
    this.data.progressRecords.unshift(newProg);
    this.persist();
    return newProg;
  }

  // --- Communications ---
  public getCommunications(appId: string): Communication[] {
    return this.data.communications.filter((c) => c.applicationId === appId);
  }

  public sendCommunication(body: any): Communication {
    const newComm: Communication = {
      id: `msg_${Date.now()}`,
      applicationId: body.applicationId,
      senderId: body.senderId || 'usr_0',
      senderName: body.senderName || 'Officer',
      senderRole: body.senderRole || 'officer',
      recipientId: body.recipientId || 'usr_app',
      recipientName: body.recipientName || 'Applicant',
      recipientRole: body.recipientRole || 'applicant',
      message: body.message,
      linkedDeficiencyId: body.linkedDeficiencyId,
      createdAt: new Date().toISOString(),
    };
    this.data.communications.push(newComm);
    this.persist();
    return newComm;
  }

  // --- Notifications ---
  public getNotifications(): Notification[] {
    return this.data.notifications;
  }

  public markNotificationRead(id: string) {
    const n = this.data.notifications.find((notif) => notif.id === id);
    if (n) {
      n.isRead = true;
      this.persist();
    }
  }

  public markAllNotificationsRead() {
    this.data.notifications.forEach((n) => (n.isRead = true));
    this.persist();
  }

  // --- Analytics ---
  public getDashboardAnalytics() {
    const apps = this.data.applications;
    const total = apps.length;
    const pending = apps.filter((a) => a.status === 'Submitted' || a.status === 'Under Verification').length;
    const eligible = apps.filter((a) => a.status === 'Eligible').length;
    const deficient = apps.filter((a) => a.status === 'Deficient').length;
    const selected = apps.filter((a) => a.status === 'Selected').length;
    const rejected = apps.filter((a) => a.status === 'Rejected').length;

    return {
      total,
      pending,
      eligible,
      deficient,
      selected,
      rejected,
      lowRiskCount: apps.filter((a) => a.riskLevel === 'LOW').length,
      mediumRiskCount: apps.filter((a) => a.riskLevel === 'MEDIUM').length,
      highRiskCount: apps.filter((a) => a.riskLevel === 'HIGH').length,
      statusDistribution: [
        { status: 'Submitted', count: apps.filter((a) => a.status === 'Submitted').length, fill: '#3B82F6' },
        { status: 'Under Verification', count: apps.filter((a) => a.status === 'Under Verification').length, fill: '#F59E0B' },
        { status: 'Deficient', count: deficient, fill: '#F97316' },
        { status: 'Eligible', count: eligible, fill: '#10B981' },
        { status: 'Selected', count: selected, fill: '#6366F1' },
        { status: 'Rejected', count: rejected, fill: '#EF4444' },
      ],
    };
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  public queryAi(query: string, applicationId?: string): { answer: string; sources: string[]; suggestedQuestions: string[] } {
    const q = query.toLowerCase();
    if (applicationId) {
      const app = this.data.applications.find((a) => a.id === applicationId);
      if (app) {
        return {
          answer: `Application ${app.applicationNumber} (${app.applicantName}) is currently in status: ${app.status}, stage: ${app.currentStage}. Consistency risk is evaluated as ${app.riskLevel || 'LOW'}.`,
          sources: [`Database Record: ${app.applicationNumber}`, 'MoTA Verification Rules'],
          suggestedQuestions: [
            `What documents are missing for ${app.applicationNumber}?`,
            `What is the eligibility breakdown for this application?`,
            `How can I resolve the open deficiency?`,
          ],
        };
      }
    }

    if (q.includes('nfst') || q.includes('fellowship')) {
      return {
        answer: 'The National Fellowship for Higher Education of ST Students (NFST) provides financial assistance to Scheduled Tribe students pursuing regular M.Phil and Ph.D. degrees in Indian universities. Annual income limit is INR 6,00,000.',
        sources: ['MoTA Scheme Guidelines: NFST 2024-25'],
        suggestedQuestions: ['What are the required documents for NFST?', 'What is the fellowship duration?'],
      };
    }

    if (q.includes('nos') || q.includes('overseas')) {
      return {
        answer: 'The National Overseas Scholarship (NOS) provides financial support to ST students pursuing Master’s or Ph.D. programs abroad at QS top 500 ranked universities. Annual family income limit is INR 6,00,000.',
        sources: ['MoTA Scheme Guidelines: NOS 2024-25'],
        suggestedQuestions: ['Which foreign universities are covered?', 'What is the allowance structure?'],
      };
    }

    return {
      answer: `Found ${this.data.applications.length} applications in the system. The verification queue has ${this.data.applications.filter((a) => a.status === 'Under Verification' || a.status === 'Submitted').length} pending applications requiring officer scrutiny.`,
      sources: ['Portal Central Repository', 'MoTA Administrative System'],
      suggestedQuestions: [
        'How many applications are currently deficient?',
        'What is the seat quota utilization for NFST?',
        'Show summary of high-risk applications',
      ],
    };
  }
}

export const clientDb = new ClientDatabase();
