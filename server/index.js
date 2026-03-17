require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');
const { startCronJobs } = require('./services/cronJobs');
const config = require('./config');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/income', require('./routes/income'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/recurring', require('./routes/recurring'));
app.use('/api/ocr', require('./routes/ocr'));
app.use('/api/setup', require('./routes/setup'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/sidehustle', require('./routes/sidehustle'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    configured: config.isConfigured(),
    version: '1.0.0',
  });
});

// ── Serve built React frontend in production ──────────────────────────────
// When NODE_ENV=production, Express serves the Vite build from ../web/dist
// This means ONE Railway service handles both API and frontend.
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../web/dist');
  app.use(express.static(frontendDist));
  // All non-API routes return index.html (React Router handles them)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

app.use(errorHandler);

// Start server only when run directly (Railway / local dev)
// When imported by Vercel's serverless entry point, skip listen()
if (require.main === module) {
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`\nVault API running on http://localhost:${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Configured: ${config.isConfigured() ? 'yes' : 'no (run setup first)'}\n`);
    startCronJobs();
  });
}

module.exports = app;
