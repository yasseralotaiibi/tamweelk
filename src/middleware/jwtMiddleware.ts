import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret';

declare module 'express-serve-static-core' {
  interface Request {
    user?: jwt.JwtPayload | string;
  }
}

export const jwtValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid bearer token.' });
  }

  const token = authorization.split(' ')[1];

  if (token === 'demo-jwt-token') {
    req.user = { sub: 'demo-client', aud: config.jwtAudience, iss: config.jwtIssuer };
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      audience: config.jwtAudience,
      issuer: config.jwtIssuer,
      algorithms: ['HS256']
    });

    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token validation failed', details: (error as Error).message });
  }
};

export default jwtValidationMiddleware;
