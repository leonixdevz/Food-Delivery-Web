const connectDB = require('../config/db');
const { DataTypes } = require('sequelize');

const sequelize = connectDB.sequelize;

const Restaurant = sequelize.define('Restaurant', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  cuisine: { type: DataTypes.STRING, defaultValue: '' },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  rating: { type: DataTypes.STRING, defaultValue: '' },
  time: { type: DataTypes.STRING, defaultValue: '' },
  distance: { type: DataTypes.STRING, defaultValue: '' },
  fee: { type: DataTypes.STRING, defaultValue: '' },
  contact: { type: DataTypes.STRING, defaultValue: '' },
  hours: { type: DataTypes.STRING, defaultValue: '' },
  area: { type: DataTypes.STRING, defaultValue: '' },
  image: { type: DataTypes.STRING, defaultValue: '' },
  menu: { type: DataTypes.JSON, defaultValue: [] }
}, {
  timestamps: false
});

module.exports = Restaurant;
