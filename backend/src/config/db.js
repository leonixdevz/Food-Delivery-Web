const path = require('path');
const { Sequelize } = require('sequelize');

const storagePath = process.env.SQLITE_STORAGE || path.join(__dirname, '../../data/database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false
});

const ensureOrderTableColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    const columns = await queryInterface.describeTable('Orders');
    const requiredColumns = {
      deliveryAddress: 'VARCHAR(255)',
      idempotencyKey: 'VARCHAR(255)',
      paymentAmountKobo: 'INTEGER',
      paymentChannel: 'VARCHAR(255)',
      paymentInitializedAt: 'DATETIME',
      paymentVerifiedAt: 'DATETIME',
      paymentPaidAt: 'DATETIME',
      paymentGatewayCreatedAt: 'DATETIME',
      paystackAuthorizationUrl: 'VARCHAR(255)',
      paystackAccessCode: 'VARCHAR(255)'
    };

    for (const [columnName, columnType] of Object.entries(requiredColumns)) {
      if (!columns[columnName]) {
        await sequelize.query(`ALTER TABLE Orders ADD COLUMN "${columnName}" ${columnType};`);
        console.log(`Added missing Orders column: ${columnName}`);
      }
    }
  } catch (error) {
    if (error.message && error.message.includes('no such table: Orders')) {
      return;
    }
    throw error;
  }
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await ensureOrderTableColumns();
    connectDB.isConnected = true;
    console.log(`Connected to SQLite at ${storagePath}`);
  } catch (error) {
    connectDB.isConnected = false;
    console.error('SQLite connection failed:', error.message || error);
  }
};

connectDB.isConnected = false;
connectDB.sequelize = sequelize;

module.exports = connectDB;
