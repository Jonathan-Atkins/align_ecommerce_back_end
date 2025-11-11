import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return next(new Error('Unauthorized'));
  const token = auth.slice(7);
  try {
    const payload = verifyToken(token) as any;
    // attach user info to request
    (req as any).user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return next(new Error('Unauthorized'));
  }
}

export function requireRole(role: 'ADMIN' | 'USER') {
  return function (req: Request, _res: Response, next: NextFunction) {
    const user = (req as any).user;
    if (!user) return next(new Error('Unauthorized'));
    if (user.role !== role) return next(new Error('Forbidden'));
    return next();
  };
}
