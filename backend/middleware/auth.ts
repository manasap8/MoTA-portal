import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/store';
import { User, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'mota-tribal-scholarship-jwt-secret-key-2025';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please log in.' },
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.findUserById(decoded.id);
    if (!user || !user.active) {
      return res.status(401).json({
        error: { code: 'USER_NOT_FOUND', message: 'User account not found or deactivated.' },
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Session expired or invalid token.' },
    });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}], current role is "${req.user.role}".`,
        },
      });
    }

    next();
  };
}
