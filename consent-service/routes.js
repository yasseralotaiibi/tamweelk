const express = require('express');
const { createConsent, getConsent, listConsents, revokeConsent } = require('./utils');
const router = express.Router();

router.post('/', (req, res) => {
  const consent = createConsent(req.body);
  res.json(consent);
});

router.get('/', (req, res) => {
  res.json(listConsents());
});

router.get('/:id', (req, res) => {
  const c = getConsent(req.params.id);
  return c ? res.json(c) : res.status(404).end();
});

router.delete('/:id', (req, res) => {
  revokeConsent(req.params.id);
  res.status(204).end();
});

module.exports = router;