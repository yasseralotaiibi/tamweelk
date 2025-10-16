const jwt = require('jsonwebtoken');
const fs = require('fs');
const config = require('../config');
const privateKey = fs.readFileSync(config.jwt.privateKey);

function sign(payload) {
  return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: config.jwt.expiresIn });
}

module.exports = { sign };