import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import {
  syncAuthenticatedUser,
  type SyncedUserRecord,
} from '../db/repository.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: SyncedUserRecord;
}

/**
 * Verifies a Firebase ID token from the Authorization Bearer header and syncs
 * the user's current role from PostgreSQL.
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Não autorizado: token de autenticação ausente.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res
      .status(401)
      .json({ error: 'Não autorizado: token de autenticação inválido.' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const dbUser = await syncAuthenticatedUser(
      decodedToken.uid,
      decodedToken.email || '',
      decodedToken.name || '',
      Boolean(decodedToken.email_verified),
    );
    req.user = decodedToken;
    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res
      .status(401)
      .json({ error: 'Não autorizado: sessão inválida ou expirada.' });
  }
};

/**
 * Strictly restricts access to verified Firebase users with the 'admin' role.
 * Must be used on all Analytics, Settings, Portfolio, Leads, and Access routes.
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  await requireAuth(req, res, () => {
    if (!req.dbUser || !req.dbUser.isAdmin) {
      return res.status(403).json({
        error:
          'Acesso negado: esta área é restrita a administradores autorizados.',
        code: 'ADMIN_REQUIRED',
      });
    }
    next();
  });
};
