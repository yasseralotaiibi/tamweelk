const fetch = require('node-fetch');
const config = require('./config');

async function authenticate(userId, bindingMessage) {
  const resp = await fetch(`${config.authServerBase}/ciba/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, bindingMessage })
  });
  return resp.json();
}

module.exports = { authenticate };