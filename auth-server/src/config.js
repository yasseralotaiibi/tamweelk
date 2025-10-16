module.exports = {
  port: process.env.PORT || 8443,
  mtls: {
    key: 'certs/server.key',
    cert: 'certs/server.crt',
    ca: 'certs/ca.crt'
  },
  jwt: {
    privateKey: 'certs/jwt.key',
    expiresIn: '1h'
  },
  demoApis: {
    nafath: 'https://reqres.in/api/users',
    absher: 'https://reqres.in/api/users/2',
    simah: 'https://fakerapi.it/api/v1/credit_cards?_quantity=1'
  }
};