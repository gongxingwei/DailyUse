import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../../users/types/user';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-access-secret';
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: '未提供认证令牌' });
    return;
  }
  try {
    const user = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ message: '令牌无效' });
  }
};
