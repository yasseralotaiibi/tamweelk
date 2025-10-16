const fetch = require('node-fetch');
const config = require('../config');
const jwtUtil = require('../utils/jwt');
const memory = new Map();

async function initiateAuth(userId, bindingMessage) {
  const resp = await fetch(config.demoApis.nafath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nationalId: userId, bindingMessage })
  });
  const data = await resp.json();
  const id = data.id.toString();
  memory.set(id, { status: 'pending', userId });
  return id;
}

async function pollAuth(authReqId) {
  const record = memory.get(authReqId);
  if (!record) throw new Error('Invalid authReqId');
  // For demo purposes, auto-complete
  record.status = 'completed';
  return record.status;
}

async function callbackAuth(authReqId, status) {
  const record = memory.get(authReqId);
  if (!record) throw new Error('Invalid authReqId');
  if (status !== 'completed') throw new Error('Authentication not completed');
  const accessToken = jwtUtil.sign({ sub: record.userId, scope: 'accounts.read payments.write' });
  const idToken = jwtUtil.sign({ sub: record.userId, name: 'Demo User' });
  return { access_token: accessToken, id_token: idToken, token_type: 'Bearer', expires_in: 3600 };
}

module.exports = { initiateAuth, pollAuth, callbackAuth };