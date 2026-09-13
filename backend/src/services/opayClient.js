/**
 * ─── OPay Merchant API Client ───
 *
 * Implements OPay's international checkout API (documentation.opaycheckout.com):
 *   - Bank Transfer payment creation  → POST /api/v1/international/payment/create
 *   - Payment status query            → POST /api/v1/international/cashier/status
 *   - Webhook signature verification  → HMAC-SHA512 of the raw JSON payload
 *
 * Requests are signed with HMAC-SHA512 of the exact JSON body, sent as
 * `Authorization: Bearer {signature}` plus a `MerchantId` header.
 * Amounts are in kobo (cent unit) per OPay's spec.
 */

const crypto = require('crypto');

const OPAY_API_BASES = {
  test: 'https://testapi.opaycheckout.com',
  live: 'https://liveapi.opaycheckout.com'
};

/**
 * Read OPay merchant settings from the environment.
 * Auto mode is active only when merchant ID, private key, and country are set.
 */
function getOpaySettings() {
  const merchantId = process.env.OPAY_MERCHANT_ID || '';
  const privateKey = process.env.OPAY_PRIVATE_KEY || '';
  const isLive = process.env.OPAY_API_MODE === 'live';
  const isConfigured = Boolean(merchantId && privateKey);

  return {
    merchantId,
    privateKey,
    isLive,
    isConfigured,
    apiBase: isLive ? OPAY_API_BASES.live : OPAY_API_BASES.test
  };
}

/** Whether automatic OPay verification is available. */
function isOpayAutoMode() {
  return getOpaySettings().isConfigured;
}

/**
 * Compute the OPay request signature: HMAC-SHA512 of the exact JSON string.
 * OPay requires JSON_UNESCAPED_SLASHES-style encoding, so we build it manually
 * instead of relying on JSON.stringify defaults.
 *
 * @param {Object} data - Request payload.
 * @returns {{ body: string, signature: string }} Serialized body and its signature.
 */
function signRequest(data) {
  const body = JSON.stringify(data).replace(/\//g, '\\/');
  const signature = crypto
    .createHmac('sha512', getOpaySettings().privateKey)
    .update(body)
    .digest('hex');
  return { body, signature };
}

/**
 * Post a signed request to the OPay API using the global fetch API
 * (Node 18+; no external HTTP dependency needed).
 *
 * @param {string} path - API path (e.g. "/api/v1/international/payment/create").
 * @param {Object} data - Request payload.
 * @returns {Promise<Object>} Parsed OPay response.
 */
async function postSigned(path, data) {
  const settings = getOpaySettings();
  const { body, signature } = signRequest(data);

  const response = await fetch(settings.apiBase + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${signature}`,
      MerchantId: settings.merchantId
    },
    body,
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OPay API HTTP ${response.status}: ${errorText.slice(0, 200)}`);
  }

  return response.json();
}

/**
 * Create a Bank Transfer payment with OPay and return the dynamic account details.
 *
 * @param {Object} params
 * @param {string} params.reference - Unique merchant reference (e.g. OPAY-FOODIE-...).
 * @param {number} params.amountNaira - Order total in Naira (converted to kobo internally).
 * @param {string} params.customerName - Customer display name.
 * @param {string} [params.customerEmail] - Customer email.
 * @param {string} [params.customerPhone] - Customer phone.
 * @param {string} params.callbackUrl - Public webhook URL for payment notifications.
 * @param {string} params.productName - Product description for the transfer narration.
 * @returns {Promise<Object>} { reference, orderNo, status, accountNumber, bankName, expiresAt }
 */
async function createBankTransferPayment({ reference, amountNaira, customerName, customerEmail, customerPhone, callbackUrl, productName }) {
  const amountKobo = Math.round(Number(amountNaira) * 100);
  if (!Number.isInteger(amountKobo) || amountKobo <= 0) {
    throw new Error('Invalid OPay transfer amount.');
  }

  const payload = {
    amount: { currency: 'NGN', total: amountKobo },
    callbackUrl,
    country: 'NG',
    customerName: customerName || 'Foodie customer',
    payMethod: 'BankTransfer',
    product: { name: productName || 'Foodie order', description: 'Foodie food order' },
    reference,
    userInfo: {
      userEmail: customerEmail || undefined,
      userId: undefined,
      userName: customerName || undefined
    },
    userPhone: customerPhone || '+2340000000000'
  };

  const response = await postSigned('/api/v1/international/payment/create', payload);

  if (response.code !== '00000' || !response.data) {
    const err = new Error(response.message || 'OPay payment creation failed.');
    err.opayCode = response.code;
    throw err;
  }

  const next = response.data.nextAction || {};
  return {
    reference: response.data.reference,
    orderNo: response.data.orderNo,
    status: response.data.status,
    accountNumber: next.transferAccountNumber || null,
    bankName: next.transferBankName || 'OPay',
    expiresAt: next.expiredTimestamp ? new Date(next.expiredTimestamp * 1000) : null,
    raw: response.data
  };
}

/**
 * Query a payment's status by merchant reference (cross-verification for webhooks
 * and polling fallback when a webhook is missed).
 *
 * @param {string} reference - Merchant reference (e.g. OPAY-FOODIE-...).
 * @returns {Promise<Object>} { status, orderNo, amountKobo, raw }
 */
async function queryPaymentStatus(reference) {
  const payload = { country: 'NG', reference };

  const response = await postSigned('/api/v1/international/cashier/status', payload);

  if (response.code !== '00000' || !response.data) {
    const err = new Error(response.message || 'OPay status query failed.');
    err.opayCode = response.code;
    throw err;
  }

  return {
    status: response.data.status,
    orderNo: response.data.orderNo,
    amountKobo: response.data.amount ? response.data.amount.total : null,
    raw: response.data
 
  };
}

/**
 * Verify a webhook callback signature.
 *
 * Per OPay docs: `sha512` field = HMAC-SHA512 of the JSON-serialized `payload`
 * object, keyed with the merchant private key. We sign the canonical re-stringified
 * payload; if that does not match we also try the raw body slice (layout differences).
 *
 * @param {string} rawBody - The raw request body string.
 * @param {string} signatureHex - The `sha512` field from the callback JSON.
 * @returns {boolean} True when the signature is valid.
 */
function verifyWebhookSignature(rawBody, signatureHex) {
  if (!signatureHex || !rawBody) return false;

  try {
    const parsed = JSON.parse(rawBody);

    // Canonical attempt: re-stringify the payload object as OPay would serialize it.
    if (parsed && typeof parsed === 'object' && parsed.payload) {
      const canonical = JSON.stringify(parsed.payload);
      const canonicalSig = crypto
        .createHmac('sha512', getOpaySettings().privateKey)
        .update(canonical)
        .digest('hex');
      if (timingSafeEqualHex(canonicalSig, signatureHex)) return true;
    }
  } catch (_parseError) {
    return false;
  }

  return false;
}

/** Constant-time hex comparison to prevent signature timing attacks. */
function timingSafeEqualHex(aHex, bHex) {
  const bufA = Buffer.from(aHex, 'hex');
  const bufB = Buffer.from(bHex, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = {
  getOpaySettings,
  isOpayAutoMode,
  signRequest,
  createBankTransferPayment,
  queryPaymentStatus,
  verifyWebhookSignature,
  timingSafeEqualHex
};
