const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const { DataTypes } = require('sequelize');

const sequelize = connectDB.sequelize;

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('user', 'admin', 'manager', 'driver'), allowNull: false, defaultValue: 'user' },
  emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  verificationToken: { type: DataTypes.STRING },
  verificationExpires: { type: DataTypes.DATE },
  resetPasswordToken: { type: DataTypes.STRING },
  resetPasswordExpires: { type: DataTypes.DATE }
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false
});

User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.prototype.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
