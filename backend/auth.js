/**
 * SahayCredit Authentication & Authorization Module
 * ===================================================
 * JWT-based authentication with RBAC, bcrypt password hashing,
 * and rate limiting for sensitive endpoints.
 *
 * Roles: borrower | lender | admin
 * Token: short-lived access (15 min) + refresh token rotation (7 days)
 */

const crypto = require('crypto');

// ── JWT Implementation (Zero-Dependency) ────────────────────────────────────
// Using Node.js built-in crypto for HMAC-SHA256 JWT signing.
// In production, consider jsonwebtoken package for full spec compliance.

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex');
const ACCESS_TOKEN_TTL = 15 * 60;    // 15 minutes
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

function base64url(str) {
  return Buffer.from(str).toString('base64url');
}

function createJWT(payload, secret, ttlSeconds) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + ttlSeconds
  }));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

// ── Password Hashing (PBKDF2 — no external dependency) ─────────────────────
// Using Node.js crypto PBKDF2 with high iteration count.
// In production, bcrypt or argon2 via npm is preferred.

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(
    password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST
  ).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const computedHash = crypto.pbkdf2Sync(
    password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST
  ).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
}


// ── In-Memory User Store ────────────────────────────────────────────────────
// In production: encrypted database table
const users = new Map();
const refreshTokens = new Map(); // token -> { userId, expiresAt }

// Seed demo users
function seedDemoUsers() {
  const demoUsers = [
    { id: 'borrower-demo', email: 'ramesh@demo.sahaycredit.in', password: 'Demo@1234', role: 'borrower', name: 'Ramesh Kumar' },
    { id: 'lender-demo', email: 'lender@demo.sahaycredit.in', password: 'Lender@1234', role: 'lender', name: 'FinServe NBFC' },
    { id: 'admin-demo', email: 'admin@demo.sahaycredit.in', password: 'Admin@1234', role: 'admin', name: 'System Admin' },
  ];

  for (const u of demoUsers) {
    users.set(u.id, {
      ...u,
      passwordHash: hashPassword(u.password),
      password: undefined // Never store plain
    });
  }
}

seedDemoUsers();


// ── Authentication Functions ────────────────────────────────────────────────

function login(email, password) {
  const user = [...users.values()].find(u => u.email === email);
  if (!user) return { success: false, error: 'Invalid credentials' };

  if (!verifyPassword(password, user.passwordHash)) {
    return { success: false, error: 'Invalid credentials' };
  }

  const accessToken = createJWT(
    { userId: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    ACCESS_TOKEN_TTL
  );

  const refreshToken = createJWT(
    { userId: user.id, type: 'refresh' },
    JWT_REFRESH_SECRET,
    REFRESH_TOKEN_TTL
  );

  refreshTokens.set(refreshToken, {
    userId: user.id,
    expiresAt: Date.now() + REFRESH_TOKEN_TTL * 1000
  });

  return {
    success: true,
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role, name: user.name }
  };
}

function refreshAccessToken(refreshToken) {
  const payload = verifyJWT(refreshToken, JWT_REFRESH_SECRET);
  if (!payload) return { success: false, error: 'Invalid or expired refresh token' };

  const stored = refreshTokens.get(refreshToken);
  if (!stored || stored.expiresAt < Date.now()) {
    refreshTokens.delete(refreshToken);
    return { success: false, error: 'Refresh token expired or revoked' };
  }

  const user = users.get(payload.userId);
  if (!user) return { success: false, error: 'User not found' };

  // Rotate: invalidate old refresh token, issue new pair
  refreshTokens.delete(refreshToken);

  const newAccess = createJWT(
    { userId: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    ACCESS_TOKEN_TTL
  );

  const newRefresh = createJWT(
    { userId: user.id, type: 'refresh' },
    JWT_REFRESH_SECRET,
    REFRESH_TOKEN_TTL
  );

  refreshTokens.set(newRefresh, {
    userId: user.id,
    expiresAt: Date.now() + REFRESH_TOKEN_TTL * 1000
  });

  return { success: true, accessToken: newAccess, refreshToken: newRefresh };
}


// ── Middleware ───────────────────────────────────────────────────────────────

/**
 * Express middleware: authenticate JWT from Authorization header.
 * Attaches req.user = { userId, role, email } on success.
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const token = header.slice(7);
  const payload = verifyJWT(token, JWT_SECRET);
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }

  req.user = { userId: payload.userId, role: payload.role, email: payload.email };
  next();
}

/**
 * Express middleware: require specific role(s).
 * Use after authMiddleware.
 * @param {...string} roles - Allowed roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }
    next();
  };
}

/**
 * Express middleware: rate limiting.
 * Simple token-bucket implementation, no external dependency.
 * @param {number} maxRequests - Max requests per window
 * @param {number} windowMs - Window size in milliseconds
 */
function rateLimit(maxRequests, windowMs) {
  const buckets = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || now - bucket.windowStart >= windowMs) {
      bucket = { windowStart: now, count: 0 };
      buckets.set(key, bucket);
    }

    bucket.count++;
    if (bucket.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((bucket.windowStart + windowMs - now) / 1000)
      });
    }

    // Cleanup old buckets periodically
    if (buckets.size > 10000) {
      for (const [k, v] of buckets) {
        if (now - v.windowStart >= windowMs * 2) buckets.delete(k);
      }
    }

    next();
  };
}

/**
 * Express middleware: input sanitization.
 * Strips dangerous characters from string inputs to prevent injection.
 */
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  next();
}

function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      // Strip script tags and common injection patterns
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/['";\\]/g, char => {
          // Escape SQL-sensitive characters
          return '\\' + char;
        });
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * Express middleware: HTTPS redirect for production.
 */
function httpsRedirect(req, res, next) {
  if (process.env.NODE_ENV === 'production' &&
      req.headers['x-forwarded-proto'] !== 'https' &&
      !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
}


module.exports = {
  login,
  refreshAccessToken,
  authMiddleware,
  requireRole,
  rateLimit,
  sanitizeInput,
  httpsRedirect,
  hashPassword,
  verifyPassword,
  createJWT,
  verifyJWT,
  JWT_SECRET
};
