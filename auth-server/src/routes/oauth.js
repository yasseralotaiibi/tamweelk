const express = require('express');
const { pollAuth, callbackAuth } = require('../services/cibaService');
const router = express.Router();

router.post('/token', async (req, res, next) => {
  try {
    const { grant_type, auth_req_id } = req.body;
    if (grant_type !== 'urn:ietf:params:oauth:grant-type:ciba') {
      return res.status(400).json({ error: 'unsupported_grant_type' });
    }
    const status = await pollAuth(auth_req_id);
    if (status !== 'completed') {
      return res.status(428).json({ error: 'authorization_pending' });
    }
    const tokens = await callbackAuth(auth_req_id, status);
    res.json(tokens);
  } catch(err) { next(err); }
});

module.exports = router;