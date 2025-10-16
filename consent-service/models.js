const { v4: uuidv4 } = require('uuid');
module.exports = {
  Consent: function(userId, tppId, permissions) {
    this.id = uuidv4();
    this.userId = userId;
    this.tppId = tppId;
    this.permissions = permissions;
    this.status = 'AUTHORIZED';
    this.timestamp = new Date();
  }
};