const cibaClient = require('./ciba-client');
const oauthClient = require('./oauth-client');

(async () => {
  const authReq = await cibaClient.authenticate('1', 'Demo binding');
  console.log('Auth Request:', authReq);

  let tokenRes;
  do {
    console.log('Polling for token...');
    tokenRes = await oauthClient.pollToken(authReq.authReqId);
    if (tokenRes.error === 'authorization_pending') {
      await new Promise(r => setTimeout(r, 2000));
    }
  } while (tokenRes.error);

  console.log('Tokens:', tokenRes);

  const accounts = await oauthClient.getAccounts(tokenRes.access_token);
  console.log('Accounts:', accounts);
})();