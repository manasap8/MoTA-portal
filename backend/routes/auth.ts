import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../database/store';
import { generateToken, authenticate, AuthenticatedRequest } from '../middleware/auth';
import { User, ApplicantProfile } from '../types';

export const authRouter = Router();

const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  dob: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  category: z.literal('ST').default('ST'),
  stCertNumber: z.string().optional(),
  stCertAuthority: z.string().optional(),
  stCertDate: z.string().optional(),
  qualification: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/register', async (req, res) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const existing = db.findUserByEmail(validated.email);
    if (existing) {
      return res.status(400).json({
        error: { code: 'DUPLICATE_EMAIL', message: 'An account with this email address already exists.' },
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(validated.password, salt);

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const user: User = {
      id: userId,
      email: validated.email.toLowerCase(),
      passwordHash,
      role: 'applicant',
      fullName: validated.fullName,
      mobile: validated.mobile,
      active: true,
      createdAt: new Date().toISOString(),
    };

    db.saveUser(user);

    const applicant: ApplicantProfile = {
      id: `app_prof_${Date.now()}`,
      userId: user.id,
      fullName: validated.fullName,
      email: validated.email.toLowerCase(),
      mobile: validated.mobile,
      dob: validated.dob || '1998-01-01',
      gender: validated.gender || 'Male',
      state: validated.state || 'Jharkhand',
      district: validated.district || 'Ranchi',
      category: 'ST',
      stCertNumber: validated.stCertNumber || '',
      stCertAuthority: validated.stCertAuthority || '',
      stCertDate: validated.stCertDate || '',
      qualification: validated.qualification || "Master's degree",
      annualIncome: 300000,
      address: '',
      pincode: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      profileCompleted: false,
      updatedAt: new Date().toISOString(),
    };

    db.saveApplicant(applicant);

    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'USER_REGISTER',
      entityType: 'User',
      entityId: user.id,
      newValue: { email: user.email, role: user.role },
      ipAddress: req.ip || '127.0.0.1',
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        mobile: user.mobile,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const issues = (err as any).issues || (err as any).errors || [];
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: issues[0]?.message || 'Invalid input data' },
      });
    }
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: err.message || 'Registration failed' },
    });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const user = db.findUserByEmail(email);

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
    }

    if (!user.active) {
      return res.status(403).json({
        error: { code: 'ACCOUNT_DEACTIVATED', message: 'Account is deactivated. Contact administrator.' },
      });
    }

    const token = generateToken(user);

    // Also set httpOnly cookie for convenience
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // development iframe compatibility
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      newValue: { loginTime: new Date().toISOString() },
      ipAddress: req.ip || '127.0.0.1',
    });

    const applicantProfile = user.role === 'applicant' ? db.findApplicantByUserId(user.id) : undefined;

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        mobile: user.mobile,
      },
      applicantProfile,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const issues = (err as any).issues || (err as any).errors || [];
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: issues[0]?.message || 'Invalid email or password format' },
      });
    }
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Authentication failed.' },
    });
  }
});

authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const applicantProfile = user.role === 'applicant' ? db.findApplicantByUserId(user.id) : undefined;

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      mobile: user.mobile,
    },
    applicantProfile,
  });
});

authRouter.post('/update-profile', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let profile = db.findApplicantByUserId(user.id);
  if (!profile) {
    profile = {
      id: `app_prof_${Date.now()}`,
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      dob: '1998-01-01',
      gender: 'Male',
      state: 'Jharkhand',
      district: 'Ranchi',
      category: 'ST',
      stCertNumber: '',
      stCertAuthority: '',
      stCertDate: '',
      qualification: "Master's degree",
      annualIncome: 300000,
      address: '',
      pincode: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      profileCompleted: false,
      updatedAt: new Date().toISOString(),
    };
  }

  const updatedProfile: ApplicantProfile = {
    ...profile,
    ...req.body,
    userId: user.id,
    profileCompleted: true,
    updatedAt: new Date().toISOString(),
  };

  db.saveApplicant(updatedProfile);

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'UPDATE_PROFILE',
    entityType: 'ApplicantProfile',
    entityId: updatedProfile.id,
    newValue: req.body,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({
    message: 'Profile updated successfully.',
    applicantProfile: updatedProfile,
  });
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully.' });
});
