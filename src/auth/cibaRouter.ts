import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { initiateCibaAuth, pollCibaToken } from './cibaService';
import { nonceValidationMiddleware } from '../middleware/nonce';
import { jwsSigningPlaceholder } from '../middleware/jwsPlaceholder';

const router = Router();

router.post(
  '/request',
  nonceValidationMiddleware,
  jwsSigningPlaceholder,
  asyncHandler(async (req, res) => {
    const { client_id: clientId, login_hint: loginHint, scope } = req.body;
    const requestedScope = Array.isArray(scope)
      ? scope
      : typeof scope === 'string'
        ? scope.split(' ')
        : [];
    const response = await initiateCibaAuth({
      clientId,
      loginHint,
      scope: requestedScope,
    });
    res.status(202).json({
      auth_req_id: response.authReqId,
      expires_in: response.expiresIn,
      interval: response.interval,
    });
  })
);

router.post(
  '/token',
  asyncHandler(async (req, res) => {
    const { auth_req_id: authReqId } = req.body;
    const tokenResponse = await pollCibaToken(authReqId);

    if (tokenResponse === 'PENDING') {
      res.status(400).json({ error: 'authorization_pending' });
      return;
    }

    if (tokenResponse === 'DENIED') {
      res.status(400).json({ error: 'access_denied' });
      return;
    }

    if (tokenResponse === 'EXPIRED') {
      res.status(400).json({ error: 'expired_token' });
      return;
    }

    res.json({
      access_token: tokenResponse.accessToken,
      id_token: tokenResponse.idToken,
      expires_in: tokenResponse.expiresIn,
      scope: tokenResponse.scope.join(' '),
      token_type: 'Bearer',
    });
  })
);

export default router;
