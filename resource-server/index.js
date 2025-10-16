const express = require('express');
const auth = require('./middleware/auth');
const accountsRouter = require('./routes/accounts');
const transactionsRouter = require('./routes/transactions');
const paymentsRouter = require('./routes/payments');

const app = express();
app.use(express.json());
app.use(auth);
app.use('/accounts', accountsRouter);
app.use('/transactions', transactionsRouter);
app.use('/payments', paymentsRouter);

app.listen(8080, () => console.log('Resource server running on 8080'));