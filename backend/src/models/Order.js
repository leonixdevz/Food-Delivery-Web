const connectDB = require('../config/db');
const { DataTypes } = require('sequelize');

const sequelize = connectDB.sequelize;

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.STRING, allowNull: false, unique: true },
  idempotencyKey: { type: DataTypes.STRING },
  customerName: { type: DataTypes.STRING, allowNull: false },
  customerEmail: { type: DataTypes.STRING },
  deliveryAddress: { type: DataTypes.STRING, allowNull: false, defaultValue: '12, Freedom Way, Lekki Phase 1, Lagos, Nigeria' },
  items: { type: DataTypes.JSON, allowNull: false },
  subtotal: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  deliveryFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 500 },
  discount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  total: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  paymentMethod: { type: DataTypes.ENUM('simulated', 'opay'), allowNull: false, defaultValue: 'simulated' },
  paymentStatus: { type: DataTypes.ENUM('Pending', 'Successful', 'Declined'), defaultValue: 'Pending' },
  paymentReference: { type: DataTypes.STRING },
  paymentAmountKobo: { type: DataTypes.INTEGER },
  paymentChannel: { type: DataTypes.STRING },
  paymentInitializedAt: { type: DataTypes.DATE },
  paymentVerifiedAt: { type: DataTypes.DATE },
  paymentPaidAt: { type: DataTypes.DATE },
  paymentGatewayCreatedAt: { type: DataTypes.DATE },
  paystackAuthorizationUrl: { type: DataTypes.STRING },
  paystackAccessCode: { type: DataTypes.STRING },
  opayOrderNo: { type: DataTypes.STRING },
  opayTransferDetails: { type: DataTypes.JSON },
  paymentProofFileName: { type: DataTypes.STRING },
  bankTransferDetails: { type: DataTypes.STRING },
  userId: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('Pending', 'Preparing', 'Completed', 'Cancelled'), defaultValue: 'Pending' }
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false
});

module.exports = Order;
