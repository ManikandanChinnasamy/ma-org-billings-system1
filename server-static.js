const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: false
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoint for checking environment
app.get('/api/info', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    platform: process.env.VERCEL ? 'vercel' : 'local',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server locally (Vercel will handle serverless execution)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║     MA Organization - Bill Management            ║
  ║     Static Web Server                             ║
  ╚═══════════════════════════════════════════════════╝
  
  🔌  Server running on port ${PORT}
  📍  Environment: ${process.env.NODE_ENV || 'production'}
  🌐  URL: http://localhost:${PORT}
  💚  Health: http://localhost:${PORT}/api/health
  `);
  });
} else {
  // For Vercel serverless
  console.log('[Vercel] Express app loaded as serverless function');
}

// Default export for Vercel
module.exports = app;
