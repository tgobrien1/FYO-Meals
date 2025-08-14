const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scan');
const { initializeGoogleSheets } = require('./services/googleSheets');
const { setupPassport } = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Setup Passport SAML
setupPassport();

// Routes
app.use('/auth', authRoutes);
app.use('/scan', scanRoutes);

// Main page - requires authentication
app.get('/', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/login');
  }
  
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  try {
    await initializeGoogleSheets();
    
    app.listen(PORT, () => {
      console.log(`🚀 RFID Check-in System running on http://localhost:${PORT}`);
      console.log('📋 Mock students: 1234567890 (John Doe), 9876543210 (Jane Smith), 5555555555 (Bob Johnson)');
      console.log(`🔐 Login at: http://localhost:${PORT}/auth/login`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
