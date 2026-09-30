import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/store';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../types';

export const usersRouter = Router();

// Admin: List all users
usersRouter.get('/', authenticate, requireRole(['admin']), (req, res) => {
  const users = db.getData().users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    fullName: u.fullName,
    mobile: u.mobile,
    active: u.active,
    createdAt: u.createdAt,
  }));
  res.json(users);
});

// Admin: Update user status or role
usersRouter.put('/:id', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  const user = db.findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });
  }

  const { role, active, fullName, mobile } = req.body;
  const prev = { ...user };

  if (role) user.role = role;
  if (active !== undefined) user.active = active;
  if (fullName) user.fullName = fullName;
  if (mobile) user.mobile = mobile;

  db.saveUser(user);

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    action: 'ADMIN_UPDATE_USER',
    entityType: 'User',
    entityId: user.id,
    previousValue: prev,
    newValue: user,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: 'User updated successfully.', user });
});

// Admin: Reset password
usersRouter.post('/:id/reset-password', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  const user = db.findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });
  }

  const newPassword = req.body.password || 'Demo@123';
  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);
  db.saveUser(user);

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    userRole: req.user!.role,
    action: 'ADMIN_RESET_PASSWORD',
    entityType: 'User',
    entityId: user.id,
    newValue: { status: 'Password reset' },
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({ message: `Password reset to "${newPassword}" successfully.` });
});
