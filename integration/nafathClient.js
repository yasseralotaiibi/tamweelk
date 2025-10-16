const fetch = require('node-fetch');
const config = require('../auth-server/src/config');

async function authenticate({ nationalId, bindingMessage, callbackUrl }) {
  const resp = await fetch(config.demoApis.nafath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nationalId, bindingMessage, callbackUrl })
  });
  return resp.json();
}

async function getAuthenticationResult(id) {
  const resp = await fetch(`${config.demoApis.nafath}/${id}`);
  return resp.json();
}

module.exports = { authenticate, getAuthenticationResult };