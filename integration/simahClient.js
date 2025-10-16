const fetch = require('node-fetch');
const config = require('../auth-server/src/config');

async function getRiskIndicators(userId) {
  const resp = await fetch(config.demoApis.simah);
  const data = (await resp.json()).data[0];
  return { fraudRiskScore: data.credit_card ? data.credit_card.length : 50 };
}

module.exports = { getRiskIndicators };