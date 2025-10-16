const express = require('express');
const { initiateAuth, pollAuth, callbackAuth } = require('../services/cibaService');
const router = express.Router();

router.post('/authenticate', async (req, res, next) => {
  try {
    const { userId, bindingMessage } = req.body;
    const txId = await initiateAuth(userId, bindingMessage);
    res.json({ authReqId: txId, expiresIn: 300 });
  } catch(err) { next(err); }
});

router.post('/poll', async (req, res, next) => {
  try {
    const { authReqId } = req.body;
    const status = await pollAuth(authReqId);
    res.json({ authStatus: status });
  } catch(err) { next(err); }
});

router.post('/callback', express.json(), async (req, res, next) => {
  try {
    const { authReqId, status } = req.body;
    const tokens = await callbackAuth(authReqId, status);
    res.json(tokens);
  } catch(err) { next(err); }
});

module.exports = router;