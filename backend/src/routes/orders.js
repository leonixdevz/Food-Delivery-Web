/**
 * ─── Order Routes ───
 *
 * API endpoints for creating, listing, and managing orders.
 *
 * Endpoints:
 *   POST   /              - Create a new order (authenticated)
 *   GET    /              - List current user's orders (authenticated)
 *   GET    /:orderId      - Get a specific order (authenticated, owner only)
 *   PUT    /:orderId/status - Update order status (authenticated, admin only)
 */

const express = require('express');
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { validateAndRecalculateOrderTotal } = require('../utils/menuLookup');

const router = express.Router();

/* ──────────────────────────────────────────────
 * POST / — Create a New Order
 * ────────────────────────────────────────────── */

/**
 * Create a new order.
 *
 * - Validates that at least one item is provided
 * - Looks up the authenticated user
 * - Checks idempotency key to prevent duplicate orders
 * - Recalculates all totals from server-side trusted prices
 *   (client-supplied prices are ignored for security)
 * - Persists the order to the database
 */
router.post('/', protect, asyncHandler(async (req, res) => {
  const {
    items,
    paymentMethod,
    paymentProofFileName,
    bankTransferDetails,
    idempotencyKey,
    deliveryAddress,
  } = req.body;

  const finalPaymentMethod = paymentMethod === 'opay' ? 'opay' : 'simulated';

  // Require at least one item
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order items are required.' });
  }

  // Verify the authenticated user still exists
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(401).json({ message: 'User not found.' });
  }

  // Idempotency check — return the existing order if this key was already used
  if (idempotencyKey) {
    const existingOrder = await Order.findOne({ where: { idempotencyKey, userId: user.id } });
    if (existingOrder) {
      return res.status(200).json(existingOrder);
    }
  }

  // SECURITY: Recalculate totals from trusted server-side menu prices.
  // The client's subtotal, deliveryFee, discount, and total are ignored.
  const { validated, recalculated } = validateAndRecalculateOrderTotal(items);
  if (!validated) {
    return res.status(400).json({ message: 'One or more items could not be found in the menu.' });
  }

  const orderId = `FOODIE-${Date.now()}`;

  const order = await Order.create({
    orderId,
    idempotencyKey: idempotencyKey || null,
    customerName: user.name,
    customerEmail: user.email,
    deliveryAddress: typeof deliveryAddress === 'string' && deliveryAddress.trim()
      ? deliveryAddress.trim()
      : '12, Freedom Way, Lekki Phase 1, Lagos, Nigeria',
    items: recalculated.items,
    subtotal: recalculated.subtotal,
    deliveryFee: recalculated.deliveryFee,
    discount: recalculated.discount,
    total: recalculated.total,
    paymentMethod: finalPaymentMethod,
    paymentProofFileName,
    bankTransferDetails,
    paymentStatus: 'Pending',
    status: 'Pending',
    userId: user.id,
  });

  res.status(201).json(order);
}));

/* ──────────────────────────────────────────────
 * GET / — List Current User's Orders
 * ────────────────────────────────────────────── */

router.get('/', protect, asyncHandler(async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
  });
  res.json(orders);
}));

/* ──────────────────────────────────────────────
 * GET /:orderId — Get a Specific Order
 * ────────────────────────────────────────────── */

router.get('/:orderId', protect, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findOne({ where: { orderId, userId: req.user.id } });

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  res.json(order);
}));

/* ──────────────────────────────────────────────
 * PUT /:orderId/status — Update Order Status (Admin)
 * ────────────────────────────────────────────── */

router.put('/:orderId/status', protect, adminOnly, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await Order.findOne({ where: { orderId } });
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  order.status = status || order.status;
  await order.save();
  res.json(order);
}));

module.exports = router;
