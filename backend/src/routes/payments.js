const express = require('express');
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();

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

  res.json({
    success: normalizedOutcome === 'success',
    pending: normalizedOutcome === 'pending',
    declined: normalizedOutcome === 'declined',
    outcome: normalizedOutcome,
    reference,
    order,
  });
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

