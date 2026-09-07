const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cookieSession = require('cookie-session');
const rateLimit = require('express-rate-limit');
const Database = require('better-sqlite3');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const dbPath = path.join(dataDir, 'responses.db');
const db = new Database(dbPath);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    choice TEXT NOT NULL CHECK(choice IN ('yes','maybe','no')),
    created_at TEXT NOT NULL
  );
`);

// Prepared statements for security and speed
const insertResponseStmt = db.prepare(`
  INSERT INTO responses (choice, created_at)
  VALUES (?, ?)
`);

const getAllResponsesStmt = db.prepare(`
  SELECT id, choice, created_at
  FROM responses
  ORDER BY id DESC
`);

const getStatsStmt = db.prepare(`
  SELECT
    SUM(CASE WHEN choice = 'yes' THEN 1 ELSE 0 END) AS yesCount,
    SUM(CASE WHEN choice = 'maybe' THEN 1 ELSE 0 END) AS maybeCount,
    SUM(CASE WHEN choice = 'no' THEN 1 ELSE 0 END) AS noCount,
    COUNT(*) AS totalCount
  FROM responses
`);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"]
      }
    }
  })
);

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Trust reverse proxies (needed for secure cookies on Render, Railway, Heroku, etc.)
app.set('trust proxy', 1);

// Cookie session config
app.use(
  cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'fallback-dev-secret-replace-in-production'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction
  })
);

// Rate limiters
const responseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again later.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many login attempts. Please try again later.' }
});

// Admin auth middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
}

// ----------------------------------------------------
// Public APIs
// ----------------------------------------------------
app.post('/api/respond', responseLimiter, (req, res) => {
  const { choice } = req.body || {};
  const validChoices = ['yes', 'maybe', 'no'];

  if (!choice || !validChoices.includes(choice)) {
    return res.status(400).json({ ok: false, error: 'Invalid choice. Must be yes, maybe, or no.' });
  }

  try {
    const timestamp = new Date().toISOString();
    insertResponseStmt.run(choice, timestamp);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to record response.' });
  }
});

// ----------------------------------------------------
// Admin APIs
// ----------------------------------------------------
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'change-this-password';

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Username and password required.' });
  }

  if (username === expectedUsername && password === expectedPassword) {
    req.session.isAdmin = true;
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
});

app.get('/api/admin/me', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ authenticated: true });
  }
  return res.json({ authenticated: false });
});

app.post('/api/admin/logout', (req, res) => {
  req.session = null;
  return res.json({ ok: true });
});

app.get('/api/admin/responses', requireAdmin, (req, res) => {
  try {
    const records = getAllResponsesStmt.all();
    const stats = getStatsStmt.get() || {
      yesCount: 0,
      maybeCount: 0,
      noCount: 0,
      totalCount: 0
    };

    return res.json({
      ok: true,
      stats: {
        yes: stats.yesCount || 0,
        maybe: stats.maybeCount || 0,
        no: stats.noCount || 0,
        total: stats.totalCount || 0
      },
      responses: records
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Failed to fetch responses.' });
  }
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Server listener
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

