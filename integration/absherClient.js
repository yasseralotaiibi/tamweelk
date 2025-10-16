const fetch = require('node-fetch');
const config = require('../auth-server/src/config');

async function verifyIdentity({ nationalId, serviceType, consentReference, dataFields }) {
  const resp = await fetch(config.demoApis.absher);
  return resp.json();
}

module.exports = { verifyIdentity };