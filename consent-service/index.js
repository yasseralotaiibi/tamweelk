const express = require('express');
const routes = require('./routes');
const app = express();
app.use(express.json());
app.use('/consents', routes);
app.listen(3000, () => console.log('Consent service running on 3000'));