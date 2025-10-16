const state = {
  authReqId: null,
  bearerToken: 'demo-jwt-token',
  nonce: () => `nonce-${Math.random().toString(36).slice(2)}`
};

const cibaForm = document.getElementById('ciba-form');
const cibaResult = document.getElementById('ciba-result');
const approveBtn = document.getElementById('approve-btn');
const denyBtn = document.getElementById('deny-btn');
const nafathResult = document.getElementById('nafath-result');
const pollBtn = document.getElementById('poll-btn');
const tokenResult = document.getElementById('token-result');
const consentForm = document.getElementById('consent-form');
const consentResult = document.getElementById('consent-result');

const postJson = async (url, body, withNonce = false) => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${state.bearerToken}`
  };

  if (withNonce) {
    headers['x-nonce'] = state.nonce();
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  return { ok: response.ok, status: response.status, payload };
};

cibaForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const clientId = document.getElementById('clientId').value;
  const scope = document.getElementById('scope').value;
  const loginHint = document.getElementById('loginHint').value;

  const result = await postJson('/api/ciba/auth/request', {
    client_id: clientId,
    scope,
    login_hint: loginHint
  }, true);

  cibaResult.textContent = JSON.stringify(result.payload, null, 2);
  if (result.ok) {
    state.authReqId = result.payload.auth_req_id;
    approveBtn.disabled = false;
    denyBtn.disabled = false;
    pollBtn.disabled = false;
  }
});

approveBtn.addEventListener('click', async () => {
  if (!state.authReqId) return;
  const result = await postJson('/api/mock/nafath/approve', { auth_req_id: state.authReqId });
  nafathResult.textContent = JSON.stringify(result.payload, null, 2);
});

denyBtn.addEventListener('click', async () => {
  if (!state.authReqId) return;
  const result = await postJson('/api/mock/nafath/deny', { auth_req_id: state.authReqId });
  nafathResult.textContent = JSON.stringify(result.payload, null, 2);
});

pollBtn.addEventListener('click', async () => {
  if (!state.authReqId) return;
  const response = await fetch('/api/ciba/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_req_id: state.authReqId })
  });
  const payload = await response.json();
  tokenResult.textContent = JSON.stringify(payload, null, 2);
});

consentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const subject = document.getElementById('consent-subject').value;
  const purpose = document.getElementById('consent-purpose').value;
  const scopes = document.getElementById('consent-scopes').value.split(',').map((scope) => scope.trim());

  const result = await postJson(
    '/api/consents',
    { subject, purpose, scopes },
    true
  );
  consentResult.textContent = JSON.stringify(result.payload, null, 2);
});
