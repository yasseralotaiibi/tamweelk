import { Router, Request, Response } from 'express';
import {
  createAuthRequest,
  pollForTokens,
  updateSessionStatus
} from './cibaService';
import jwtValidationMiddleware from '../middleware/jwtMiddleware';
import nonceValidationMiddleware from '../middleware/nonceMiddleware';

const router = Router();

router.post(
  '/ciba/auth/request',
  jwtValidationMiddleware,
  nonceValidationMiddleware,
  async (req: Request, res: Response) => {
    const { client_id: clientId, scope, login_hint: loginHint } = req.body || {};

    if (!clientId || !scope || !loginHint) {
      return res.status(400).json({ error: 'client_id, scope and login_hint are required' });
    }

    const result = await createAuthRequest({ clientId, scope, loginHint });
    return res.json({
      auth_req_id: result.authReqId,
      expires_in: result.expiresIn,
      interval: result.interval
    });
  }
);

router.post('/ciba/auth/token', async (req: Request, res: Response) => {
  const { auth_req_id: authReqId } = req.body || {};

  if (!authReqId) {
    return res.status(400).json({ error: 'auth_req_id is required' });
  }

  const response = await pollForTokens(authReqId);

  if (response.status === 'PENDING') {
    return res.status(202).json({
      status: 'PENDING',
      interval: response.interval,
      message: 'Authorization pending. Continue polling.'
    });
  }

  if (response.status === 'DENIED') {
    return res.status(400).json({ status: 'DENIED', error: 'Authentication request not approved.' });
  }

  return res.json({
    access_token: response.accessToken,
    id_token: response.idToken,
    token_type: 'Bearer',
    expires_in: 300
  });
});

router.post('/mock/nafath/approve', async (req: Request, res: Response) => {
  const { auth_req_id: authReqId } = req.body || {};
  if (!authReqId) {
    return res.status(400).json({ error: 'auth_req_id is required' });
  }
  const updated = await updateSessionStatus(authReqId, 'APPROVED');
  if (!updated) {
    return res.status(404).json({ error: 'Auth request not found' });
  }
  return res.json({ status: 'APPROVED', auth_req_id: authReqId });
});

router.post('/mock/nafath/deny', async (req: Request, res: Response) => {
  const { auth_req_id: authReqId } = req.body || {};
  if (!authReqId) {
    return res.status(400).json({ error: 'auth_req_id is required' });
  }
  const updated = await updateSessionStatus(authReqId, 'DENIED');
  if (!updated) {
    return res.status(404).json({ error: 'Auth request not found' });
  }
  return res.json({ status: 'DENIED', auth_req_id: authReqId });
});

export default router;
