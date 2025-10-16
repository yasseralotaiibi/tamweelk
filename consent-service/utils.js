const { v4: uuidv4 } = require('uuid');
const consents = new Map();

function createConsent({ userId, tppId, permissions }) {
  const id = uuidv4();
  const consent = { id, userId, tppId, permissions, status: 'AUTHORIZED', timestamp: new Date() };
  consents.set(id, consent);
  return consent;
}

function getConsent(id) {
  return consents.get(id);
}

function listConsents() {
  return Array.from(consents.values());
}

function revokeConsent(id) {
  consents.delete(id);
}

module.exports = { createConsent, getConsent, listConsents, revokeConsent };