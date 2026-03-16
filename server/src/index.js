const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Load environment variables (works locally and on Railway)
const envPath = path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath, override: false });

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const marketResearchRoutes = require('./routes/marketResearch');
const offerRoutes = require('./routes/offers');
const trafficStrategyRoutes = require('./routes/trafficStrategy');
const landingPageRoutes = require('./routes/landingPages');
const creativeRoutes = require('./routes/creatives');
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');
const strategyRoutes = require('./routes/strategy');

// Import controllers for Socket.io integration
const { setIO, createNotification } = require('./controllers/projectController');

// Create Express app
const app = express();

// Connect to database
connectDB();

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173'
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/market-research', marketResearchRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/traffic-strategy', trafficStrategyRoutes);
app.use('/api/landing-pages', landingPageRoutes);
app.use('/api/creatives', creativeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/strategy', strategyRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default server error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   🚀 Growth Valley - Performance Marketer API         ║
  ║                                                       ║
  ║   Server running on port ${PORT}                        ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                        ║
  ║   Socket.io enabled                                   ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
});

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173'
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Pass io to project controller for notifications
setIO(io);

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Join user's personal room for notifications
  socket.join(socket.userId);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Export createNotification for use in other controllers
module.exports = { app, io, createNotification };