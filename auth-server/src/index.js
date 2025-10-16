const express = require('express');
const helmet = require('helmet');
const fs = require('fs');
const https = require('https');
const config = require('./config');
const cibaRoutes = require('./routes/ciba');
const oauthRoutes = require('./routes/oauth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(express.json());

app.use('/ciba', cibaRoutes);
app.use('/oauth', oauthRoutes);
app.use(errorHandler);

const options = {
  key: fs.readFileSync(config.mtls.key),
  cert: fs.readFileSync(config.mtls.cert),
  ca: fs.readFileSync(config.mtls.ca),
  requestCert: true,
  rejectUnauthorized: true
};

https.createServer(options, app)
  .listen(config.port, () => console.log(`Auth Server running on ${config.port}`));