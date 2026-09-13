const express = require('express');
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * Send an email notification.
 * Uses environment variables for SMTP configuration.
 */
/**
 * Send an email notification. Never throws — a failed email must not
 * fail the payment request that triggered it.
 * Returns true when sent, false when skipped or failed.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP not configured. Email contents:', { to, subject, text });
    return false;
  }

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@foodie.com',
      to,
      subject,
      text,
      html
    });
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    return false;
  }
};

router.post('/demo', protect, asyncHandler(async (req, res) => {
  const { orderId, channel, outcome } = req.body;
  if (!orderId) {
    return res.status(400).json({ message: 'orderId is required.' });
  }

  const order = await Order.findOne({ where: { orderId, userId: req.user.id } });
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  if (order.paymentMethod !== 'simulated') {
    return res.status(400).json({ message: 'This order is not configured for simulated payment.' });
  }

  if (order.paymentStatus === 'Successful') {
    return res.status(409).json({ message: 'This order has already been paid successfully.' });
  }

  const normalizedOutcome = outcome === 'pending' ? 'pending' : outcome === 'declined' ? 'declined' : 'success';
  const amountKobo = Math.round(Number(order.total) * 100);
  if (!Number.isInteger(amountKobo) || amountKobo <= 0) {
    return res.status(400).json({ message: 'Order total must be a positive amount.' });
  }

  const now = new Date();
  const reference = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  order.paymentReference = reference;
  order.paymentAmountKobo = amountKobo;
  const paymentChannel = typeof channel === 'string' && channel.trim() ? channel.trim() : 'Simulated payment';
  order.paymentChannel = `SIMULATED / ${paymentChannel}`;
  order.paymentInitializedAt = now;
  order.paymentVerifiedAt = now;
  order.paymentGatewayCreatedAt = now;
  order.paymentPaidAt = normalizedOutcome === 'success' ? now : null;
  order.paymentStatus = normalizedOutcome === 'success' ? 'Successful' : normalizedOutcome === 'declined' ? 'Declined' : 'Pending';
  await order.save();

  // Send payment status email notification
  const user = await User.findByPk(req.user.id);
  if (user) {
    const statusText = normalizedOutcome === 'success' ? 'successful' : normalizedOutcome === 'declined' ? 'declined' : 'pending';
    const amountFormatted = `₦${(order.total || 0).toLocaleString('en-NG')}`;

    let emailSubject = '';
    let emailBody = '';

    if (normalizedOutcome === 'success') {
      emailSubject = 'Payment Successful - Your Foodie Order is Confirmed!';
      emailBody = `
        <h2>Payment Successful!</h2>
        <p>Hi ${user.name || 'Foodie User'},</p>
        <p>Your payment of <strong>${amountFormatted}</strong> for order <strong>${order.orderId}</strong> has been processed successfully.</p>
        <p><strong>Payment Reference:</strong> ${reference}</p>
        <p>Your order is now being prepared and will be delivered soon.</p>
        <p>Thank you for choosing Foodie!</p>
        <p>Best regards,<br/>The Foodie Team</p>
      `;
    } else if (normalizedOutcome === 'declined') {
      emailSubject = 'Payment Declined - Foodie Order';
      emailBody = `
        <h2>Payment Declined</h2>
        <p>Hi ${user.name || 'Foodie User'},</p>
        <p>Unfortunately, your payment of <strong>${amountFormatted}</strong> for order <strong>${order.orderId}</strong> was declined.</p>
        <p><strong>Payment Reference:</strong> ${reference}</p>
        <p>Please check your payment details and try again, or contact your bank for more information.</p>
        <p>Best regards,<br/>The Foodie Team</p>
      `;
    } else {
      emailSubject = 'Payment Pending - Foodie Order';
      emailBody = `
        <h2>Payment Pending</h2>
        <p>Hi ${user.name || 'Foodie User'},</p>
        <p>Your payment of <strong>${amountFormatted}</strong> for order <strong>${order.orderId}</strong> is currently pending.</p>
        <p><strong>Payment Reference:</strong> ${reference}</p>
        <p>We'll notify you once the payment is confirmed.</p>
        <p>Best regards,<br/>The Foodie Team</p>
      `;
    }

    await sendEmail({
      to: user.email,
      subject: emailSubject,
      text: emailBody.replace(/<[^>]*>/g, ''),
      html: emailBody
    });
  }

  res.json({
    success: normalizedOutcome === 'success',
    pending: normalizedOutcome === 'pending',
    declined: normalizedOutcome === 'declined',
    outcome: normalizedOutcome,
    reference,
    order,
  });
}));

/* ──────────────────────────────────────────────
 * OPay Transfer Payment
 * ──────────────────────────────────────────────
 * Two modes:
 *   - AUTO (OPAY_MERCHANT_ID + OPAY_PRIVATE_KEY set):
 *     Creates a Bank Transfer payment via OPay's merchant API. OPay issues a
 *     unique, single-use account number per order and calls our webhook when
 *     the money lands. Verification = HMAC-SHA512 signature + status API.
 *   - MANUAL (no merchant credentials):
 *     Static account number from env; user confirms manually (trusted flow).
 */

const opayClient = require('../services/opayClient');

/** Read the static merchant OPay account details for manual mode. */
const getOpayAccount = () => ({
  bankName: process.env.OPAY_BANK_NAME || 'OPay',
  accountName: process.env.OPAY_ACCOUNT_NAME || 'Foodie.',
  accountNumber: process.env.OPAY_ACCOUNT_NUMBER || '9123456789',
  isConfigured: Boolean(process.env.OPAY_ACCOUNT_NUMBER)
});

/** Build the public webhook URL that OPay should call. */
const buildOpayWebhookUrl = () => {
  const base = process.env.BACKEND_URL || process.env.PUBLIC_URL || 'http://localhost:5000';
  return `${base.replace(/\/$/, '')}/api/payments/opay/webhook`;
};

/** Map OPay gateway statuses to local order payment statuses. */
const mapOpayStatus = (gatewayStatus) => {
  if (gatewayStatus === 'SUCCESS') return 'Successful';
  if (gatewayStatus === 'FAIL' || gatewayStatus === 'CLOSE' || gatewayStatus === 'CANCEL') return 'Declined';
  return 'Pending';
};

/** Send the payment-confirmed email for a successful OPay order. */
async function sendOpaySuccessEmail(order, user) {
  if (!user) return;
  const amountFormatted = `₦${(order.total || 0).toLocaleString('en-NG')}`;
  await sendEmail({
    to: user.email,
    subject: 'Payment Received - Your Foodie Order is Confirmed!',
    text: `Hi ${user.name || 'Foodie User'},\n\nWe have received your OPay transfer of ${amountFormatted} for order ${order.orderId}.\n\nPayment Reference: ${order.paymentReference}\n\nYour order is now being prepared and will be delivered soon.\n\nBest regards,\nThe Foodie Team`,
    html: `
      <h2>Payment Received!</h2>
      <p>Hi ${user.name || 'Foodie User'},</p>
      <p>We have received your <strong>OPay transfer</strong> of <strong>${amountFormatted}</strong> for order <strong>${order.orderId}</strong>.</p>
      <p><strong>Payment Reference:</strong> ${order.paymentReference}</p>
      <p>Your order is now being prepared and will be delivered soon.</p>
      <p>Thank you for choosing Foodie!</p>
      <p>Best regards,<br/>The Foodie Team</p>
    `
  });
}

/** Persist a successful OPay payment on the order and notify the customer. */
async function markOrderOpaySuccess(order, { transactionId } = {}) {
  const now = new Date();
  order.paymentStatus = 'Successful';
  order.paymentVerifiedAt = now;
  order.paymentPaidAt = now;
  if (transactionId) {
    order.paymentChannel = `OPay transfer / ${transactionId}`;
  }
  await order.save();

  const user = await User.findByPk(order.userId);
  await sendOpaySuccessEmail(order, user);
}

router.get('/opay/config', asyncHandler(async (req, res) => {
  const account = getOpayAccount();
  res.json({
    ...account,
    mode: opayClient.isOpayAutoMode() ? 'auto' : 'manual'
  });
}));

router.post('/opay/initiate', protect, asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ message: 'orderId is required.' });
  }

  const order = await Order.findOne({ where: { orderId, userId: req.user.id } });
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  if (order.paymentMethod !== 'opay') {
    return res.status(400).json({ message: 'This order is not configured for OPay payment.' });
  }

  if (order.paymentStatus === 'Successful') {
    return res.status(409).json({ message: 'This order has already been paid successfully.' });
  }

  const amountKobo = Math.round(Number(order.total) * 100);
  if (!Number.isInteger(amountKobo) || amountKobo <= 0) {
    return res.status(400).json({ message: 'Order total must be a positive amount.' });
  }

  const now = new Date();
  const reference = `OPAY-${order.orderId}`;
  order.paymentReference = reference;
  order.paymentAmountKobo = amountKobo;
  order.paymentInitializedAt = now;
  order.paymentStatus = 'Pending';

  // AUTO MODE — create a Bank Transfer payment with a unique dynamic account
  if (opayClient.isOpayAutoMode()) {
    try {
      const transfer = await opayClient.createBankTransferPayment({
        reference,
        amountNaira: order.total,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        callbackUrl: buildOpayWebhookUrl(),
        productName: `Foodie order ${order.orderId}`
      });

      order.opayOrderNo = transfer.orderNo;
      order.opayTransferDetails = {
        accountNumber: transfer.accountNumber,
        bankName: transfer.bankName,
        expiresAt: transfer.expiresAt
      };
      order.paymentChannel = 'OPay transfer (auto)';
      order.paymentGatewayCreatedAt = new Date();
      await order.save();

      return res.json({
        mode: 'auto',
        reference,
        amount: order.total,
        amountKobo,
        order: order.orderId,
        account: {
          bankName: transfer.bankName,
          accountName: order.customerName || 'Foodie.',
          accountNumber: transfer.accountNumber,
          expiresAt: transfer.expiresAt
        }
      });
    } catch (error) {
      console.error('OPay auto initiate failed, falling back to manual:', error.message);
      // fall through to manual mode
    }
  }

  // MANUAL MODE — static account number, user-confirmed
  const account = getOpayAccount();
  order.paymentChannel = 'OPay transfer';
  await order.save();

  res.json({
    mode: 'manual',
    reference,
    amount: order.total,
    amountKobo,
    order: order.orderId,
    account: {
      bankName: account.bankName,
      accountName: account.accountName,
      accountNumber: account.accountNumber
    }
  });
}));

/**
 * Manual confirmation — only allowed in manual mode. In auto mode the order
 * is confirmed exclusively by OPay's signed webhook + status API.
 */
router.post('/opay/confirm', protect, asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ message: 'orderId is required.' });
  }

  const order = await Order.findOne({ where: { orderId, userId: req.user.id } });
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  if (order.paymentMethod !== 'opay') {
    return res.status(400).json({ message: 'This order is not configured for OPay payment.' });
  }

  if (order.paymentStatus === 'Successful') {
    return res.status(409).json({ message: 'This order has already been paid successfully.' });
  }

  if (opayClient.isOpayAutoMode()) {
    return res.status(400).json({
      message: 'This order is verified automatically by OPay. We will confirm your payment shortly.'
    });
  }

  await markOrderOpaySuccess(order);
  res.json({ order, success: true, reference: order.paymentReference });
}));

/**
 * Poll the current OPay payment state for an order. In auto mode this also
 * cross-checks the OPay status API, so the flow completes even if the webhook
 * was missed (e.g. localhost development).
 */
router.get('/opay/status/:orderId', protect, asyncHandler(async (req, res) => {
  const order = await Order.findOne({ where: { orderId: req.params.orderId, userId: req.user.id } });
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  if (order.paymentMethod !== 'opay') {
    return res.status(400).json({ message: 'This order is not configured for OPay payment.' });
  }

  if (order.paymentStatus === 'Pending' && opayClient.isOpayAutoMode() && order.paymentReference) {
    try {
      const gateway = await opayClient.queryPaymentStatus(order.paymentReference);
      const mapped = mapOpayStatus(gateway.status);

      if (mapped === 'Successful') {
        // Guard against partial transfers: the paid amount must match the order total
        if (gateway.amountKobo === null || gateway.amountKobo === order.paymentAmountKobo) {
          await markOrderOpaySuccess(order, { transactionId: gateway.orderNo });
        } else {
          console.error(`OPay amount mismatch for ${order.orderId}: expected ${order.paymentAmountKobo}, got ${gateway.amountKobo}`);
        }
      } else if (mapped === 'Declined' && order.paymentStatus === 'Pending') {
        order.paymentStatus = 'Declined';
        order.paymentVerifiedAt = new Date();
        await order.save();
      }
    } catch (error) {
      // Gateway unreachable or reference unknown yet — report current DB state
      console.warn(`OPay status poll failed for ${order.orderId}:`, error.message);
    }
  }

  await order.reload();
  res.json({
    orderId: order.orderId,
    paymentStatus: order.paymentStatus,
    reference: order.paymentReference
  });
}));

/**
 * OPay webhook (public). Bodies on this path are parsed as raw Buffer by the
 * express.raw middleware mounted in index.js, so we can verify the signature
 * against the exact bytes OPay signed.
 */
router.post('/opay/webhook', asyncHandler(async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

  let callback;
  try {
    callback = JSON.parse(rawBody);
  } catch (_parseError) {
    return res.status(400).json({ message: 'Invalid JSON payload.' });
  }

  const { payload, sha512 } = callback || {};
  if (!payload || !sha512) {
    return res.status(400).json({ message: 'Missing payload or signature.' });
  }

  // 1. Verify the HMAC-SHA512 signature came from OPay
  if (!opayClient.verifyWebhookSignature(rawBody, sha512)) {
    console.warn('Rejected OPay webhook: invalid signature.');
    return res.status(401).json({ message: 'Invalid signature.' });
  }

  const { reference, status, transactionId, amount } = payload;
  if (!reference) {
    return res.status(200).json({ received: true });
  }

  const order = await Order.findOne({ where: { paymentReference: reference, paymentMethod: 'opay' } });
  if (!order) {
    // Unknown reference — acknowledge so OPay stops retrying
    return res.status(200).json({ received: true });
  }

  if (order.paymentStatus === 'Successful') {
    return res.status(200).json({ received: true });
  }

  // 2. Cross-verify with the status API (per OPay docs, defends against forged payloads)
  let verifiedStatus = status;
  let verifiedOrderNo = transactionId;
  try {
    const gateway = await opayClient.queryPaymentStatus(reference);
    verifiedStatus = gateway.status;
    verifiedOrderNo = gateway.orderNo || transactionId;
  } catch (error) {
    // Status API unreachable — the valid signature is already cryptographic proof
    console.warn(`OPay status cross-check failed for ${reference}:`, error.message);
  }

  const mapped = mapOpayStatus(verifiedStatus);
  if (mapped === 'Successful') {
    // 3. Amount check: reject partial or overpayment attempts
    const paidKobo = Number(amount) || null;
    if (paidKobo !== null && paidKobo !== order.paymentAmountKobo) {
      console.error(`OPay webhook amount mismatch for ${order.orderId}: expected ${order.paymentAmountKobo}, got ${paidKobo}`);
      return res.status(200).json({ received: true });
    }
    await markOrderOpaySuccess(order, { transactionId: verifiedOrderNo });
  } else if (mapped === 'Declined' && order.paymentStatus === 'Pending') {
    order.paymentStatus = 'Declined';
    order.paymentVerifiedAt = new Date();
    await order.save();
  }

  res.status(200).json({ received: true });
}));

router.post('/verify', protect, asyncHandler(async (req, res) => {
  const { reference } = req.body;
  if (!reference) {
    return res.status(400).json({ message: 'Payment reference is required.' });
  }

  const order = await Order.findOne({ where: { paymentReference: reference, userId: req.user.id } });
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  if (order.paymentMethod !== 'simulated' || !reference.startsWith('SIM-')) {
    return res.status(400).json({ message: 'This is not a simulated transaction.' });
  }

  res.json({ order, simulated: true, reference });
}));

module.exports = router;

