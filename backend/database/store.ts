import fs from 'fs';
import path from 'path';
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

export interface DatabaseSchema {
  users: User[];
  applicants: ApplicantProfile[];
  schemes: Scheme[];
  applications: Application[];
  documents: ApplicationDocument[];
  deficiencies: Deficiency[];
  eligibilityResults: Record<string, EligibilityResult>;
  consistencyResults: Record<string, ConsistencyResult>;
  selectionRecords: SelectionRecord[];
  postSelectionRecords: PostSelectionRecord[];
  progressRecords: ProgressRecord[];
  notifications: Notification[];
  communications: Communication[];
  auditLogs: AuditLog[];
  aiCache: Record<string, string>;
}

class DatabaseStore {
  private dataDir: string;
  private dbFilePath: string;
  private memoryData: DatabaseSchema;
  private isSaving: boolean = false;
  private savePending: boolean = false;

  constructor() {
    this.dataDir = path.resolve(process.env.DATA_DIR || './data');
    this.dbFilePath = path.join(this.dataDir, 'database.json');
    this.memoryData = this.getEmptySchema();
    this.init();
  }

  private getEmptySchema(): DatabaseSchema {
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
      aiCache: {},
    };
  }

  private init() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        this.memoryData = { ...this.getEmptySchema(), ...JSON.parse(raw) };
      } else {
        this.persistSync();
      }
    } catch (err) {
      console.error('Error initializing database store:', err);
      this.memoryData = this.getEmptySchema();
    }
  }

  public persistSync() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.memoryData, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database synchronously:', err);
    }
  }

  public async persist(): Promise<void> {
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
      await fs.promises.writeFile(tmpPath, JSON.stringify(this.memoryData, null, 2), 'utf-8');
      await fs.promises.rename(tmpPath, this.dbFilePath);
    } catch (err) {
      console.error('Failed to persist database:', err);
    } finally {
      this.isSaving = false;
      if (this.savePending) {
        this.savePending = false;
        this.persist();
      }
    }
  }

  public getData(): DatabaseSchema {
    return this.memoryData;
  }

  public replaceAll(newData: DatabaseSchema) {
    this.memoryData = newData;
    this.persistSync();
  }

  // --- Users ---
  public findUserById(id: string): User | undefined {
    return this.memoryData.users.find((u) => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.memoryData.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public saveUser(user: User) {
    const idx = this.memoryData.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.memoryData.users[idx] = user;
    } else {
      this.memoryData.users.push(user);
    }
    this.persist();
  }

  // --- Applicants ---
  public findApplicantByUserId(userId: string): ApplicantProfile | undefined {
    return this.memoryData.applicants.find((a) => a.userId === userId);
  }

  public findApplicantById(id: string): ApplicantProfile | undefined {
    return this.memoryData.applicants.find((a) => a.id === id);
  }

  public saveApplicant(profile: ApplicantProfile) {
    const idx = this.memoryData.applicants.findIndex((a) => a.id === profile.id);
    if (idx >= 0) {
      this.memoryData.applicants[idx] = profile;
    } else {
      this.memoryData.applicants.push(profile);
    }
    this.persist();
  }

  // --- Schemes ---
  public getSchemes(): Scheme[] {
    return this.memoryData.schemes;
  }

  public findSchemeById(id: string): Scheme | undefined {
    return this.memoryData.schemes.find((s) => s.id === id || s.code.toLowerCase() === id.toLowerCase());
  }

  public saveScheme(scheme: Scheme) {
    const idx = this.memoryData.schemes.findIndex((s) => s.id === scheme.id);
    if (idx >= 0) {
      this.memoryData.schemes[idx] = scheme;
    } else {
      this.memoryData.schemes.push(scheme);
    }
    this.persist();
  }

  // --- Applications ---
  public getApplications(): Application[] {
    return this.memoryData.applications;
  }

  public findApplicationById(id: string): Application | undefined {
    return this.memoryData.applications.find((a) => a.id === id || a.applicationNumber === id);
  }

  public findApplicationsByApplicantId(applicantId: string): Application[] {
    return this.memoryData.applications.filter((a) => a.applicantId === applicantId);
  }

  public saveApplication(application: Application) {
    const idx = this.memoryData.applications.findIndex((a) => a.id === application.id);
    if (idx >= 0) {
      this.memoryData.applications[idx] = application;
    } else {
      this.memoryData.applications.push(application);
    }
    this.persist();
  }

  // --- Documents ---
  public getDocumentsByApplicationId(applicationId: string): ApplicationDocument[] {
    return this.memoryData.documents.filter((d) => d.applicationId === applicationId);
  }

  public findDocumentById(id: string): ApplicationDocument | undefined {
    return this.memoryData.documents.find((d) => d.id === id);
  }

  public saveDocument(doc: ApplicationDocument) {
    const idx = this.memoryData.documents.findIndex((d) => d.id === doc.id);
    if (idx >= 0) {
      this.memoryData.documents[idx] = doc;
    } else {
      this.memoryData.documents.push(doc);
    }
    this.persist();
  }

  public deleteDocument(id: string) {
    this.memoryData.documents = this.memoryData.documents.filter((d) => d.id !== id);
    this.persist();
  }

  // --- Consistency Results ---
  public getConsistency(applicationId: string): ConsistencyResult | undefined {
    return this.memoryData.consistencyResults[applicationId];
  }

  public saveConsistency(applicationId: string, result: ConsistencyResult) {
    this.memoryData.consistencyResults[applicationId] = result;
    this.persist();
  }

  // --- Eligibility Results ---
  public getEligibility(applicationId: string): EligibilityResult | undefined {
    return this.memoryData.eligibilityResults[applicationId];
  }

  public saveEligibility(applicationId: string, result: EligibilityResult) {
    this.memoryData.eligibilityResults[applicationId] = result;
    this.persist();
  }

  // --- Deficiencies ---
  public getDeficienciesByApplicationId(applicationId: string): Deficiency[] {
    return this.memoryData.deficiencies.filter((d) => d.applicationId === applicationId);
  }

  public getAllDeficiencies(): Deficiency[] {
    return this.memoryData.deficiencies;
  }

  public findDeficiencyById(id: string): Deficiency | undefined {
    return this.memoryData.deficiencies.find((d) => d.id === id);
  }

  public saveDeficiency(deficiency: Deficiency) {
    const idx = this.memoryData.deficiencies.findIndex((d) => d.id === deficiency.id);
    if (idx >= 0) {
      this.memoryData.deficiencies[idx] = deficiency;
    } else {
      this.memoryData.deficiencies.push(deficiency);
    }
    this.persist();
  }

  // --- Selection Records ---
  public getSelectionRecords(): SelectionRecord[] {
    return this.memoryData.selectionRecords;
  }

  public findSelectionByApplicationId(applicationId: string): SelectionRecord | undefined {
    return this.memoryData.selectionRecords.find((s) => s.applicationId === applicationId);
  }

  public saveSelectionRecord(record: SelectionRecord) {
    const idx = this.memoryData.selectionRecords.findIndex((s) => s.id === record.id);
    if (idx >= 0) {
      this.memoryData.selectionRecords[idx] = record;
    } else {
      this.memoryData.selectionRecords.push(record);
    }
    this.persist();
  }

  // --- Post Selection Records ---
  public getPostSelectionRecords(): PostSelectionRecord[] {
    return this.memoryData.postSelectionRecords;
  }

  public findPostSelectionByApplicationId(applicationId: string): PostSelectionRecord | undefined {
    return this.memoryData.postSelectionRecords.find((p) => p.applicationId === applicationId);
  }

  public savePostSelectionRecord(record: PostSelectionRecord) {
    const idx = this.memoryData.postSelectionRecords.findIndex((p) => p.id === record.id);
    if (idx >= 0) {
      this.memoryData.postSelectionRecords[idx] = record;
    } else {
      this.memoryData.postSelectionRecords.push(record);
    }
    this.persist();
  }

  // --- Progress Records ---
  public getProgressRecordsByApplicationId(applicationId: string): ProgressRecord[] {
    return this.memoryData.progressRecords.filter((p) => p.applicationId === applicationId);
  }

  public saveProgressRecord(record: ProgressRecord) {
    const idx = this.memoryData.progressRecords.findIndex((p) => p.id === record.id);
    if (idx >= 0) {
      this.memoryData.progressRecords[idx] = record;
    } else {
      this.memoryData.progressRecords.push(record);
    }
    this.persist();
  }

  // --- Notifications ---
  public getNotificationsByUserId(userId: string): Notification[] {
    return this.memoryData.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(notification: Notification) {
    this.memoryData.notifications.unshift(notification);
    this.persist();
  }

  public markNotificationAsRead(id: string, userId: string) {
    const item = this.memoryData.notifications.find((n) => n.id === id && n.userId === userId);
    if (item) {
      item.isRead = true;
      this.persist();
    }
  }

  public markAllNotificationsAsRead(userId: string) {
    this.memoryData.notifications.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    this.persist();
  }

  // --- Communications ---
  public getCommunicationsByApplicationId(applicationId: string): Communication[] {
    return this.memoryData.communications
      .filter((c) => c.applicationId === applicationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addCommunication(comm: Communication) {
    this.memoryData.communications.push(comm);
    this.persist();
  }

  // --- Audit Logs (Append-Only) ---
  public getAuditLogs(): AuditLog[] {
    return [...this.memoryData.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.memoryData.auditLogs.push(log);
    this.persist();
  }

  // --- AI Cache ---
  public getCachedAi(key: string): string | undefined {
    return this.memoryData.aiCache[key];
  }

  public setCachedAi(key: string, value: string) {
    this.memoryData.aiCache[key] = value;
    this.persist();
  }
}

export const db = new DatabaseStore();
