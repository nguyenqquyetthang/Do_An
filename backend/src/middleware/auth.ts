import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types/http.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function issueToken(userId: number, role: string) {
  return jwt.sign({ role }, config.jwtSecret, { subject: String(userId), expiresIn: '8h' });
}

export function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const header = request.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    response.status(401).json({ error: 'Bạn cần đăng nhập để thực hiện thao tác này.' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
      throw new Error('Invalid token payload');
    }
    request.user = { userId: Number(payload.sub), role: payload.role };
    next();
  } catch {
    response.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
}

export function requireAdmin(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (request.user?.role !== 'ADMIN') {
    response.status(403).json({ error: 'Bạn không có quyền quản trị.' });
    return;
  }
  next();
}

export function requireProgramManager(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  if (request.user?.role !== 'ADMIN' && request.user?.role !== 'ORGANIZER') {
    response.status(403).json({ error: 'Chỉ người tạo chương trình hoặc quản trị viên mới có quyền này.' });
    return;
  }
  next();
}

export function asyncRoute(handler: (request: AuthenticatedRequest, response: Response) => Promise<void>) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    handler(request, response).catch(next);
  };
}
