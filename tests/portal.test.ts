import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { ConsistencyEngine } from '../backend/ai/consistencyEngine';
import { EligibilityEngine } from '../backend/ai/eligibilityEngine';
import { DemoOcrProvider } from '../backend/ai/ocrProvider';
import { AiAssistantService } from '../backend/ai/aiAssistantService';
import { generateToken } from '../backend/middleware/auth';
import { SchemeRule, Application, ApplicationDocument, User } from '../backend/types';

describe('1. Auth & Security Tests', () => {
  it('should hash and verify passwords with bcrypt', () => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Demo@123', salt);
    assert.strictEqual(bcrypt.compareSync('Demo@123', hash), true);
    assert.strictEqual(bcrypt.compareSync('WrongPassword', hash), false);
  });

  it('should generate valid JWT tokens with role claims', () => {
    const demoUser: User = {
      id: 'usr_test_1',
      email: 'applicant@demo.com',
      passwordHash: 'hash',
      role: 'applicant',
      fullName: 'Rahul Soren',
      mobile: '9876543210',
      active: true,
      createdAt: new Date().toISOString(),
    };
    const token = generateToken(demoUser);
    assert.ok(token);
    assert.strictEqual(typeof token, 'string');
    assert.ok(token.split('.').length === 3);
  });
});

describe('2. Deterministic Rule Engine Tests', () => {
  const sampleRules: SchemeRule[] = [
    {
      id: 'r_cat',
      criterion: 'Category ST',
      type: 'required',
      targetType: 'field',
      targetKey: 'category',
      operator: 'equals',
      expectedValue: 'ST',
      weight: 20,
      failMessage: 'Category must be ST',
      evidenceSource: 'ST Cert',
    },
    {
      id: 'r_marks',
      criterion: 'Min marks 55%',
      type: 'required',
      targetType: 'field',
      targetKey: 'marksPercentage',
      operator: 'greaterThanOrEqual',
      expectedValue: 55,
      weight: 20,
      failMessage: 'Marks below 55%',
      evidenceSource: 'Marksheet',
    },
    {
      id: 'r_income',
      criterion: 'Income ceiling 600000',
      type: 'required',
      targetType: 'field',
      targetKey: 'annualIncome',
      operator: 'lessThanOrEqual',
      expectedValue: 600000,
      weight: 20,
      failMessage: 'Income exceeds limit',
      evidenceSource: 'Income Cert',
    },
    {
      id: 'r_doc_st',
      criterion: 'ST cert uploaded',
      type: 'required',
      targetType: 'document',
      targetKey: 'st_certificate',
      operator: 'documentExists',
      expectedValue: true,
      weight: 20,
      failMessage: 'Missing ST document',
      evidenceSource: 'Uploaded file',
    },
  ];

  it('evaluates fully eligible candidate with all PASS criteria', () => {
    const app: any = {
      id: 'app_test_1',
      applicantName: 'Kishan Munda',
      data: { category: 'ST', marksPercentage: 72, annualIncome: 300000 },
    };
    const docs: any[] = [
      { id: 'd1', docType: 'st_certificate', title: 'ST Cert', fileStatus: 'Processed' },
    ];

    const result = EligibilityEngine.evaluate(app, docs, sampleRules);
    assert.strictEqual(result.overallStatus, 'Eligible');
    assert.strictEqual(result.criteriaResults.every((c) => c.status === 'PASS'), true);
  });

  it('evaluates ineligible candidate when income exceeds threshold', () => {
    const app: any = {
      id: 'app_test_2',
      applicantName: 'Vikram Jamatia',
      data: { category: 'ST', marksPercentage: 72, annualIncome: 850000 },
    };
    const docs: any[] = [
      { id: 'd1', docType: 'st_certificate', title: 'ST Cert', fileStatus: 'Processed' },
    ];

    const result = EligibilityEngine.evaluate(app, docs, sampleRules);
    assert.strictEqual(result.overallStatus, 'Ineligible');
    const incomeFail = result.criteriaResults.find((c) => c.criterionId === 'r_income');
    assert.strictEqual(incomeFail?.status, 'FAIL');
  });

  it('flags missing mandatory document', () => {
    const app: any = {
      id: 'app_test_3',
      applicantName: 'Sunita Kerketta',
      data: { category: 'ST', marksPercentage: 72, annualIncome: 300000 },
    };
    const docs: any[] = []; // No ST cert

    const result = EligibilityEngine.evaluate(app, docs, sampleRules);
    assert.strictEqual(result.overallStatus, 'Ineligible');
    const docFail = result.criteriaResults.find((c) => c.criterionId === 'r_doc_st');
    assert.strictEqual(docFail?.status, 'FAIL');
  });
});

describe('3. Consistency & Risk Engine Tests', () => {
  it('assigns high score (>=85%) and LOW risk when details are aligned', () => {
    const app: any = {
      id: 'app_aligned',
      applicantName: 'Rahul Kumar Soren',
      data: { fullName: 'Rahul Kumar Soren', dob: '1998-05-12', category: 'ST' },
    };
    const docs: any[] = [
      {
        id: 'd1',
        title: 'ST Certificate',
        docType: 'st_certificate',
        extractedData: { name: 'Rahul Kumar Soren', dob: '1998-05-12', category: 'ST' },
      },
    ];

    const result = ConsistencyEngine.evaluate(app, docs);
    assert.ok(result.score >= 85);
    assert.strictEqual(result.riskLevel, 'LOW');
  });

  it('detects initial/formatting variation and assigns WARNING without hard fail', () => {
    const app: any = {
      id: 'app_var',
      applicantName: 'Rahul Kumar',
      data: { fullName: 'Rahul Kumar', dob: '1998-05-12' },
    };
    const docs: any[] = [
      {
        id: 'd1',
        title: 'ST Certificate',
        docType: 'st_certificate',
        extractedData: { name: 'Rahul K.', dob: '1998-05-12' },
      },
    ];

    const result = ConsistencyEngine.evaluate(app, docs);
    const nameFinding = result.findings.find((f) => f.field === 'fullName');
    assert.strictEqual(nameFinding?.status, 'WARNING');
  });

  it('detects date of birth mismatch and flags HIGH severity', () => {
    const app: any = {
      id: 'app_dob_mismatch',
      applicantName: 'Pooja Maravi',
      data: { fullName: 'Pooja Maravi', dob: '1998-05-12' },
    };
    const docs: any[] = [
      {
        id: 'd1',
        title: 'ST Certificate',
        docType: 'st_certificate',
        extractedData: { name: 'Pooja Maravi', dob: '1998-05-21' },
      },
    ];

    const result = ConsistencyEngine.evaluate(app, docs);
    const dobFinding = result.findings.find((f) => f.field === 'dob');
    assert.strictEqual(dobFinding?.status, 'FAIL');
    assert.strictEqual(result.riskLevel, 'HIGH');
  });

  it('flags expired certificates', () => {
    const app: any = {
      id: 'app_expired',
      applicantName: 'Kishan Munda',
      data: { fullName: 'Kishan Munda', dob: '1996-11-04' },
    };
    const docs: any[] = [
      {
        id: 'd1',
        title: 'Income Certificate',
        docType: 'income_certificate',
        extractedData: { name: 'Kishan Munda', expiryDate: '2023-03-31' },
      },
    ];

    const result = ConsistencyEngine.evaluate(app, docs);
    const expFinding = result.findings.find((f) => f.field === 'expiryDate');
    assert.strictEqual(expFinding?.status, 'WARNING');
  });
});

describe('4. AI Unavailable Deterministic Fallbacks', () => {
  it('DemoOcrProvider provides deterministic extraction without API keys', async () => {
    const ocr = new DemoOcrProvider();
    const extracted = await ocr.extract(
      '/tmp/file.pdf',
      'sample_st_cert_matching.pdf',
      'st_certificate',
      { fullName: 'Bikash Oraon', dob: '1997-03-25' }
    );
    assert.strictEqual(extracted.name, 'Bikash Oraon');
    assert.strictEqual(extracted.dob, '1997-03-25');
    assert.strictEqual(extracted.provider, 'demo');
    assert.ok(extracted.confidenceScores?.name! > 0.8);
  });

  it('AiAssistantService resolves queries deterministically from database', async () => {
    const response = await AiAssistantService.query('How many applications are in the system?', 'officer');
    assert.ok(response.answer.includes('applications'));
    assert.ok(response.sources.length > 0);
  });
});
