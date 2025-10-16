const fetch = require('node-fetch');
const config = require('./config');

async function pollToken(authReqId) {
  const resp = await fetch(`${config.authServerBase}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'urn:ietf:params:oauth:grant-type:ciba', auth_req_id: authReqId })
  });
  return resp.json();
}

async function getAccounts(token) {
  const resp = await fetch(`${config.resourceServerBase}/accounts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return resp.json();
}

module.exports = { pollToken, getAccounts };