const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required. Set it in backend/.env or your environment.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payments/opay/webhook', express.raw({ type: '*/*' }));
app.use(express.json());
app.use(morgan('tiny'));

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

const frontendPath = path.resolve(__dirname, '../../frontend');

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(express.static(frontendPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API route not found.' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(errorHandler);

const openBrowser = (url) => {
  if (process.env.AUTO_OPEN_BROWSER === 'false') return;

  /** Determine the platform-specific command and arguments for opening a URL. */
  function getPlatformCommand() {
    switch (process.platform) {
      case 'darwin': return { command: 'open', args: [url] };
      case 'win32': return { command: 'cmd', args: ['/c', 'start', '""', url] };
      default: return { command: 'xdg-open', args: [url] };
    }
  }

  try {
    const { spawn } = require('child_process');
    const { command, args } = getPlatformCommand();
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      shell: false,
    });
    child.unref();
  } catch (err) {
    console.warn('Browser open failed:', err.message);
  }
};

const desiredPort = Number(process.env.PORT) || 5000;
let currentPort = desiredPort;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Foodie backend listening on port ${port}`);
    console.log(`Open http://localhost:${port}`);
    openBrowser(`http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use. Trying port ${port + 1}...`);
      currentPort += 1;
      startServer(currentPort);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

startServer(currentPort);
