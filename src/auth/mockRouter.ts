import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { approveCibaAuth, denyCibaAuth } from './cibaService';
import { resolveNafathAuth } from '../connectors/nafathConnector';

const router = Router();

router.post(
  '/nafath/approve',
  asyncHandler(async (req, res) => {
    const { auth_req_id: authReqId, subject } = req.body;
    await resolveNafathAuth(`nafath-${authReqId}`, 'APPROVED');
    await approveCibaAuth(authReqId, subject || 'demo-user');
    res.json({ status: 'APPROVED', auth_req_id: authReqId });
  })
);

router.post(
  '/nafath/deny',
  asyncHandler(async (req, res) => {
    const { auth_req_id: authReqId } = req.body;
    await resolveNafathAuth(`nafath-${authReqId}`, 'DENIED');
    await denyCibaAuth(authReqId);
    res.json({ status: 'DENIED', auth_req_id: authReqId });
  })
);

export default router;
