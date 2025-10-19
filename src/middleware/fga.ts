import { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from './jwtAuth';
import { checkAccess } from '../services/fgaService';

export type FgaOptions = {
  action: string;
  resourceType: string;
  resourceIdResolver: (req: AuthenticatedRequest) => string;
  contextResolver?: (req: AuthenticatedRequest) => Record<string, unknown>;
};

export const fgaMiddleware = (options: FgaOptions) =>
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.organization) {
      res.status(400).json({ error: 'Organization not resolved' });
      return;
    }

    const resourceId = options.resourceIdResolver(req);
    if (!resourceId) {
      res.status(400).json({ error: 'Resource identifier missing' });
      return;
    }

    const allowed = await checkAccess({
      organizationId: req.organization.id,
      subject: {
        id: (req.user?.sub as string) ?? 'anonymous',
        type: req.user?.sub ? 'user' : 'service',
        roles: req.subjectRoles,
      },
      action: options.action,
      resourceType: options.resourceType,
      resourceId,
      context: options.contextResolver?.(req) ?? {},
    });

    if (!allowed) {
      res.status(403).json({ error: 'Access denied by policy' });
      return;
    }

    next();
  };
