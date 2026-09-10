const express = require('express');
const asyncHandler = require('express-async-handler');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/restaurants', asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.findAll();
  res.json(restaurants);
}));

router.post('/restaurants', asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.create(req.body);
  res.status(201).json(restaurant);
}));

router.delete('/restaurants/:id', asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ message: 'Restaurant not found.' });
  }
  await restaurant.destroy();
  res.json({ message: 'Restaurant removed.' });
}));

router.get('/orders', asyncHandler(async (req, res) => {
  const orders = await Order.findAll({ order: [['createdAt', 'DESC']] });
  res.json(orders);
}));

router.put('/orders/:orderId/status', asyncHandler(async (req, res) => {
  const order = await Order.findOne({ where: { orderId: req.params.orderId } });
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }
  order.status = req.body.status || order.status;
  await order.save();
  res.json(order);
}));

router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken' ] } });
  res.json(users);
}));

router.put('/users/:id/role', asyncHandler(async (req, res) => {
  const allowedRoles = ['user', 'admin', 'manager', 'driver'];
  const { role } = req.body;
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }

  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  user.role = role;
  await user.save();
  res.json({ message: 'User role updated.', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

module.exports = router;
