const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

// ============================================
// CONFIG
// ============================================
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'bibleglocal_secret_key_2025_jjh';
const JWT_EXPIRES = '7d';
const COOKIE_NAME = 'bg_token';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// DATABASE SETUP
// ============================================
const db = new Database(path.join(__dirname, 'bibleglocal.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT,
    display_name TEXT,
    role TEXT DEFAULT 'member',
    provider TEXT DEFAULT 'email',
    provider_id TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    ip_address TEXT,
    success INTEGER DEFAULT 0,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_by TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ============================================
// SEED ADMIN ACCOUNT — Professor Jung
// ============================================
const adminEmail = 'st805@naver.com';
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

if (!adminExists) {
  const adminId = uuidv4();
  const hashedPassword = bcrypt.hashSync('#972553', 12);
  db.prepare(`
    INSERT INTO users (id, email, username, password_hash, display_name, role, provider, is_active)
    VALUES (?, ?, ?, ?, ?, 'admin', 'email', 1)
  `).run(adminId, adminEmail, '청산_정중호', hashedPassword, '(청산) 정중호');
  console.log('✅ Admin account created for Professor Jung Joong-Ho');
} else {
  console.log('ℹ️ Admin account already exists');
}

// Insert default site settings
const settingsExist = db.prepare("SELECT key FROM site_settings WHERE key = 'site_name'").get();
if (!settingsExist) {
  const settings = [
    ['site_name', '정중호 교수의 성경 사랑방'],
    ['site_name_en', "Prof. Jung's Bible Study Room"],
    ['site_email', 'bibleglocal@gmail.com'],
    ['site_url', 'bibleglocal.org'],
    ['maintenance_mode', 'false'],
    ['allow_registration', 'true']
  ];
  const insertSetting = db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)');
  settings.forEach(([k, v]) => insertSetting.run(k, v));
}

// ============================================
// HELPERS
// ============================================
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, username: user.username, display_name: user.display_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.cookies[COOKIE_NAME] || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  if (!token) return res.status(401).json({ error: 'Authentication required', error_kr: '로그인이 필요합니다' });
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid or expired token', error_kr: '인증이 만료되었습니다' });
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(decoded.id);
  if (!user) return res.status(401).json({ error: 'User not found', error_kr: '사용자를 찾을 수 없습니다' });
  req.user = user;
  next();
}

// Admin middleware
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required', error_kr: '관리자 권한이 필요합니다' });
  }
  next();
}

// Rate limiter for login
const loginAttempts = new Map();
function rateLimitLogin(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(t => now - t < 15 * 60 * 1000); // 15 min window
  if (recentAttempts.length >= 10) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.', error_kr: '로그인 시도가 너무 많습니다. 나중에 다시 시도해 주세요.' });
  }
  loginAttempts.set(ip, recentAttempts);
  next();
}

// ============================================
// AUTH API ROUTES
// ============================================

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, username, display_name } = req.body;

    // Check registration allowed
    const regAllowed = db.prepare("SELECT value FROM site_settings WHERE key = 'allow_registration'").get();
    if (regAllowed && regAllowed.value === 'false') {
      return res.status(403).json({ error: 'Registration is currently disabled', error_kr: '현재 회원가입이 비활성화되어 있습니다' });
    }

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required', error_kr: '이메일, 비밀번호, 사용자명은 필수입니다' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters', error_kr: '비밀번호는 최소 6자 이상이어야 합니다' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format', error_kr: '올바른 이메일 형식이 아닙니다' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered', error_kr: '이미 등록된 이메일입니다' });
    }

    const id = uuidv4();
    const password_hash = bcrypt.hashSync(password, 12);
    const dname = display_name || username;

    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, display_name, role, provider)
      VALUES (?, ?, ?, ?, ?, 'member', 'email')
    `).run(id, email.toLowerCase(), username, password_hash, dname);

    const user = db.prepare('SELECT id, email, username, display_name, role FROM users WHERE id = ?').get(id);
    const token = generateToken(user);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({ success: true, message: 'Registration successful', message_kr: '회원가입이 완료되었습니다', user: { id: user.id, email: user.email, username: user.username, display_name: user.display_name, role: user.role }, token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error', error_kr: '서버 오류가 발생했습니다' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', rateLimitLogin, (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required', error_kr: '이메일과 비밀번호를 입력해 주세요' });
    }

    // Debug logging
    console.log(`[LOGIN ATTEMPT] Email: ${email.toLowerCase()}, IP: ${req.ip}`);

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    
    if (!user) {
      console.log(`[LOGIN FAILED] User not found: ${email.toLowerCase()}`);
      try {
        db.prepare('INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, 0)').run(email, req.ip);
      } catch (e) {
        // Ignore if login_attempts table doesn't exist
      }
      const attempts = loginAttempts.get(req.ip) || [];
      attempts.push(Date.now());
      loginAttempts.set(req.ip, attempts);
      return res.status(401).json({ error: 'Invalid email or password', error_kr: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    if (!user.password_hash) {
      console.log(`[LOGIN FAILED] No password hash for user: ${email.toLowerCase()}`);
      return res.status(401).json({ error: 'Please login with your social account', error_kr: '소셜 계정으로 로그인해 주세요' });
    }

    console.log(`[LOGIN ATTEMPT] User found, comparing password for: ${email.toLowerCase()}`);

    const valid = bcrypt.compareSync(password, user.password_hash);
    console.log(`[LOGIN ATTEMPT] Password comparison result: ${valid} for ${email.toLowerCase()}`);
    
    if (!valid) {
      console.log(`[LOGIN FAILED] Invalid password for: ${email.toLowerCase()}`);
      try {
        db.prepare('INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, 0)').run(email, req.ip);
      } catch (e) {
        // Ignore if login_attempts table doesn't exist
      }
      const attempts = loginAttempts.get(req.ip) || [];
      attempts.push(Date.now());
      loginAttempts.set(req.ip, attempts);
      return res.status(401).json({ error: 'Invalid email or password', error_kr: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    console.log(`[LOGIN SUCCESS] User logged in: ${email.toLowerCase()}, Role: ${user.role}`);

    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    db.prepare('INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, 1)').run(email, req.ip);

    const token = generateToken(user);

    // Store session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(sessionId, user.id, token, req.ip, req.headers['user-agent'] || '', expiresAt);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({
      success: true,
      message: 'Login successful',
      message_kr: '로그인 성공',
      user: { id: user.id, email: user.email, username: user.username, display_name: user.display_name, role: user.role, avatar_url: user.avatar_url },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error', error_kr: '서버 오류가 발생했습니다' });
  }
});

// POST /api/auth/social-login (Simulated OAuth for Gmail, Naver, Kakao)
app.post('/api/auth/social-login', (req, res) => {
  try {
    const { provider, provider_id, email, name, avatar_url } = req.body;

    if (!provider || !email) {
      return res.status(400).json({ error: 'Provider and email required', error_kr: '소셜 로그인 정보가 필요합니다' });
    }

    const validProviders = ['google', 'naver', 'kakao'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider', error_kr: '지원하지 않는 소셜 로그인입니다' });
    }

    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

    if (user) {
      // Update provider info if needed
      if (!user.provider_id && provider_id) {
        db.prepare('UPDATE users SET provider = ?, provider_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(provider, provider_id, user.id);
      }
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    } else {
      // Create new user via social login
      const id = uuidv4();
      const username = name || email.split('@')[0];
      db.prepare(`
        INSERT INTO users (id, email, username, display_name, role, provider, provider_id, avatar_url)
        VALUES (?, ?, ?, ?, 'member', ?, ?, ?)
      `).run(id, email.toLowerCase(), username, name || username, provider, provider_id || '', avatar_url || '');
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    }

    const token = generateToken(user);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({
      success: true,
      message: 'Social login successful',
      message_kr: '소셜 로그인 성공',
      user: { id: user.id, email: user.email, username: user.username, display_name: user.display_name, role: user.role, avatar_url: user.avatar_url },
      token
    });
  } catch (err) {
    console.error('Social login error:', err);
    res.status(500).json({ error: 'Server error', error_kr: '서버 오류가 발생했습니다' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const { password_hash, ...userData } = req.user;
  res.json({ success: true, user: userData });
});

// GET /api/auth/verify - Alias for /api/auth/me
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  const { password_hash, ...userData } = req.user;
  res.json({ success: true, user: userData });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.clearCookie(COOKIE_NAME);
  res.json({ success: true, message: 'Logged out', message_kr: '로그아웃 되었습니다' });
});

// PUT /api/auth/profile
app.put('/api/auth/profile', authMiddleware, (req, res) => {
  try {
    const { display_name, bio, username } = req.body;
    const updates = [];
    const params = [];

    if (display_name !== undefined) { updates.push('display_name = ?'); params.push(display_name); }
    if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
    if (username !== undefined) { updates.push('username = ?'); params.push(username); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update', error_kr: '수정할 항목이 없습니다' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.user.id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const user = db.prepare('SELECT id, email, username, display_name, role, bio, avatar_url FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, message: 'Profile updated', message_kr: '프로필이 수정되었습니다', user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error', error_kr: '서버 오류가 발생했습니다' });
  }
});

// PUT /api/auth/change-password
app.put('/api/auth/change-password', authMiddleware, (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new passwords required', error_kr: '현재 비밀번호와 새 비밀번호를 입력해 주세요' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters', error_kr: '새 비밀번호는 최소 6자 이상이어야 합니다' });
    }
    if (!bcrypt.compareSync(current_password, req.user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect', error_kr: '현재 비밀번호가 올바르지 않습니다' });
    }
    const hash = bcrypt.hashSync(new_password, 12);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, req.user.id);
    res.json({ success: true, message: 'Password changed', message_kr: '비밀번호가 변경되었습니다' });
  } catch (err) {
    res.status(500).json({ error: 'Server error', error_kr: '서버 오류가 발생했습니다' });
  }
});

// ============================================
// ADMIN API ROUTES
// ============================================

// GET /api/admin/users
app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  const users = db.prepare('SELECT id, email, username, display_name, role, provider, created_at, last_login, is_active FROM users ORDER BY created_at DESC').all();
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === 'admin').length,
    members: users.filter(u => u.role === 'member').length
  };
  res.json({ success: true, users, stats });
});

// PUT /api/admin/users/:id
app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { role, is_active, display_name } = req.body;
    const userId = req.params.id;

    // Prevent self-demotion
    if (userId === req.user.id && role && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot change own admin role', error_kr: '자신의 관리자 권한을 변경할 수 없습니다' });
    }

    const updates = [];
    const params = [];
    if (role !== undefined) { updates.push('role = ?'); params.push(role); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (display_name !== undefined) { updates.push('display_name = ?'); params.push(display_name); }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const user = db.prepare('SELECT id, email, username, display_name, role, is_active FROM users WHERE id = ?').get(userId);
    res.json({ success: true, message: 'User updated', message_kr: '사용자 정보가 수정되었습니다', user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  const userId = req.params.id;
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete own account', error_kr: '자신의 계정을 삭제할 수 없습니다' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.json({ success: true, message: 'User deleted', message_kr: '사용자가 삭제되었습니다' });
});

// GET /api/admin/settings
app.get('/api/admin/settings', authMiddleware, adminMiddleware, (req, res) => {
  const settings = db.prepare('SELECT * FROM site_settings').all();
  const obj = {};
  settings.forEach(s => { obj[s.key] = s.value; });
  res.json({ success: true, settings: obj });
});

// PUT /api/admin/settings
app.put('/api/admin/settings', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const updates = req.body;
    const upsert = db.prepare('INSERT INTO site_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP');
    Object.entries(updates).forEach(([key, value]) => {
      upsert.run(key, value, req.user.id, value, req.user.id);
    });
    res.json({ success: true, message: 'Settings updated', message_kr: '설정이 저장되었습니다' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/stats
app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count;
  const todayLogins = db.prepare("SELECT COUNT(*) as count FROM login_attempts WHERE success = 1 AND attempted_at >= date('now')").get().count;
  const recentUsers = db.prepare('SELECT id, email, username, display_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 5').all();
  const loginHistory = db.prepare("SELECT DATE(attempted_at) as date, COUNT(*) as total, SUM(success) as successful FROM login_attempts WHERE attempted_at >= date('now', '-7 days') GROUP BY DATE(attempted_at) ORDER BY date").all();
  res.json({ success: true, stats: { totalUsers, activeUsers, todayLogins, recentUsers, loginHistory } });
});

// ============================================
// SERVE FRONTEND
// ============================================
// CONTENT MANAGEMENT SYSTEM (CMS)
// ============================================

// Create CMS tables
db.exec(`
  CREATE TABLE IF NOT EXISTS page_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_path TEXT NOT NULL,
    selector TEXT NOT NULL,
    content TEXT,
    content_type TEXT DEFAULT 'html',
    updated_by TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(page_path, selector)
  );
  CREATE TABLE IF NOT EXISTS page_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_name TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    uploaded_by TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS page_layouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_path TEXT NOT NULL UNIQUE,
    layout_data TEXT,
    updated_by TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create board system tables
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    post_type TEXT NOT NULL DEFAULT 'post',
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    is_published INTEGER DEFAULT 1,
    is_pinned INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    image_url TEXT,
    video_url TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Create indexes for better performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
  CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
  CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(is_published, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(is_pinned DESC, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
`);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir, { recursive: true });
}

// --- Image Upload (using built-in parsing) ---
const fs = require('fs');
const crypto = require('crypto');

// Multipart form parser for image uploads
app.post('/api/admin/upload-image', authMiddleware, adminMiddleware, (req, res) => {
  const chunks = [];
  let totalSize = 0;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  req.on('data', chunk => {
    totalSize += chunk.length;
    if (totalSize > MAX_SIZE) {
      res.status(413).json({ success: false, message: 'File too large (max 10MB)' });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    try {
      const body = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('multipart/form-data')) {
        const boundary = contentType.split('boundary=')[1];
        if (!boundary) return res.status(400).json({ success: false, message: 'No boundary' });

        const parts = parseMultipart(body, boundary);
        const filePart = parts.find(p => p.filename);
        if (!filePart) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const ext = path.extname(filePart.filename).toLowerCase() || '.jpg';
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
        if (!allowed.includes(ext)) {
          return res.status(400).json({ success: false, message: 'Invalid file type' });
        }

        const uniqueName = crypto.randomBytes(12).toString('hex') + ext;
        const filePath = path.join(uploadsDir, uniqueName);
        fs.writeFileSync(filePath, filePart.data);

        const insert = db.prepare(`INSERT INTO page_images (original_name, file_name, file_path, mime_type, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)`);
        const result = insert.run(filePart.filename, uniqueName, `/uploads/${uniqueName}`, filePart.contentType, filePart.data.length, req.user.id);

        return res.json({
          success: true,
          image: {
            id: result.lastInsertRowid,
            url: `/uploads/${uniqueName}`,
            name: filePart.filename,
            size: filePart.data.length
          }
        });
      } else if (contentType.includes('application/json')) {
        // Handle base64 image upload
        const data = JSON.parse(body.toString());
        if (!data.image || !data.filename) {
          return res.status(400).json({ success: false, message: 'Missing image data' });
        }
        const base64Data = data.image.replace(/^data:image\/\w+;base64,/, '');
        const ext = path.extname(data.filename).toLowerCase() || '.jpg';
        const uniqueName = crypto.randomBytes(12).toString('hex') + ext;
        const filePath = path.join(uploadsDir, uniqueName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        const insert = db.prepare(`INSERT INTO page_images (original_name, file_name, file_path, mime_type, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)`);
        const fileSize = fs.statSync(filePath).size;
        const result = insert.run(data.filename, uniqueName, `/uploads/${uniqueName}`, `image/${ext.slice(1)}`, fileSize, req.user.id);

        return res.json({
          success: true,
          image: { id: result.lastInsertRowid, url: `/uploads/${uniqueName}`, name: data.filename, size: fileSize }
        });
      }
      res.status(400).json({ success: false, message: 'Unsupported content type' });
    } catch (e) {
      console.error('Upload error:', e);
      res.status(500).json({ success: false, message: 'Upload failed' });
    }
  });
});

// Simple multipart parser
function parseMultipart(body, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let start = body.indexOf(boundaryBuffer) + boundaryBuffer.length + 2;

  while (start < body.length) {
    const end = body.indexOf(boundaryBuffer, start);
    if (end === -1) break;

    const part = body.slice(start, end - 2);
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) { start = end + boundaryBuffer.length + 2; continue; }

    const headers = part.slice(0, headerEnd).toString();
    const data = part.slice(headerEnd + 4);

    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    const ctMatch = headers.match(/Content-Type:\s*(.+)/i);

    parts.push({
      name: nameMatch ? nameMatch[1] : '',
      filename: filenameMatch ? filenameMatch[1] : null,
      contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
      data
    });

    start = end + boundaryBuffer.length + 2;
  }
  return parts;
}

// --- List uploaded images ---
app.get('/api/admin/images', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const images = db.prepare('SELECT * FROM page_images ORDER BY uploaded_at DESC').all();
    res.json({ success: true, images });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load images' });
  }
});

// --- Delete image ---
app.delete('/api/admin/images/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const image = db.prepare('SELECT * FROM page_images WHERE id = ?').get(req.params.id);
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' });

    const filePath = path.join(__dirname, 'public', image.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.prepare('DELETE FROM page_images WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Image deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// --- Save page content ---
app.post('/api/admin/content', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { page_path, contents } = req.body;
    if (!page_path || !contents || !Array.isArray(contents)) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }

    const upsert = db.prepare(`
      INSERT INTO page_content (page_path, selector, content, content_type, updated_by)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(page_path, selector) DO UPDATE SET
        content = excluded.content,
        content_type = excluded.content_type,
        updated_by = excluded.updated_by,
        updated_at = CURRENT_TIMESTAMP
    `);

    const saveMany = db.transaction((items) => {
      for (const item of items) {
        upsert.run(page_path, item.selector, item.content, item.type || 'html', req.user.id);
      }
    });
    saveMany(contents);

    res.json({ success: true, message: 'Content saved', count: contents.length });
  } catch (e) {
    console.error('Content save error:', e);
    res.status(500).json({ success: false, message: 'Save failed' });
  }
});

// --- Load page content ---
app.get('/api/admin/content/:pagePath', authMiddleware, (req, res) => {
  try {
    const pagePath = decodeURIComponent(req.params.pagePath);
    const contents = db.prepare('SELECT selector, content, content_type, updated_at FROM page_content WHERE page_path = ?').all(pagePath);
    res.json({ success: true, contents });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Load failed' });
  }
});

// --- Save page layout ---
app.post('/api/admin/layout', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { page_path, layout_data } = req.body;
    if (!page_path || !layout_data) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }

    db.prepare(`
      INSERT INTO page_layouts (page_path, layout_data, updated_by)
      VALUES (?, ?, ?)
      ON CONFLICT(page_path) DO UPDATE SET
        layout_data = excluded.layout_data,
        updated_by = excluded.updated_by,
        updated_at = CURRENT_TIMESTAMP
    `).run(page_path, JSON.stringify(layout_data), req.user.id);

    res.json({ success: true, message: 'Layout saved' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Layout save failed' });
  }
});

// --- Load page layout ---
app.get('/api/admin/layout/:pagePath', authMiddleware, (req, res) => {
  try {
    const pagePath = decodeURIComponent(req.params.pagePath);
    const layout = db.prepare('SELECT layout_data, updated_at FROM page_layouts WHERE page_path = ?').get(pagePath);
    res.json({ success: true, layout: layout ? JSON.parse(layout.layout_data) : null });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Layout load failed' });
  }
});

// ==================== BOARD API ENDPOINTS ====================

// Get posts with filters
app.get('/api/posts', (req, res) => {
    try {
      const { category, post_type, limit = 20, offset = 0, search } = req.query;
      
      let query = `
        SELECT p.*, 
          COUNT(c.id) as comment_count
        FROM posts p
        LEFT JOIN comments c ON p.id = c.post_id
        WHERE p.is_published = 1
      `;
      
      const params = [];
      
      if (category) {
        query += ' AND p.category = ?';
        params.push(category);
      }
      
      if (post_type) {
        query += ' AND p.post_type = ?';
        params.push(post_type);
      }
      
      if (search) {
        query += ' AND (p.title LIKE ? OR p.content LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      query += ' GROUP BY p.id ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
      
      const posts = db.prepare(query).all(...params);
      
      res.json({
        success: true,
        data: posts,
        count: posts.length
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch posts' });
    }
  });

  // Get recent posts for main page
  app.get('/api/posts/recent', (req, res) => {
    try {
      const { limit = 5 } = req.query;
      
      const categories = [
        { key: 'korean_thought', name: '한국사상과성경' },
        { key: 'world_thought', name: '세계사상과성경' },
        { key: 'publications', name: '책과논문' },
        { key: 'forum', name: '열린마당' },
        { key: 'announcements', name: '공지사항' },
        { key: 'general', name: '게시판' },
        { key: 'media', name: '이미지&동영상' }
      ];
      
      const result = {};
      
      for (const cat of categories) {
        const posts = db.prepare(`
          SELECT id, title, content, author_name, created_at, image_url, video_url
          FROM posts
          WHERE category = ? AND is_published = 1
          ORDER BY is_pinned DESC, created_at DESC
          LIMIT ?
        `).all(cat.key, parseInt(limit));
        
        result[cat.key] = {
          name: cat.name,
          posts: posts.map(post => ({
            ...post,
            excerpt: post.content.substring(0, 150) + '...'
          }))
        };
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching recent posts:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch recent posts' });
    }
  });

  // Get single post with comments
  app.get('/api/posts/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      // Increment view count
      db.prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?').run(id);
      
      // Get post
      const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
      
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }
      
      // Get comments
      const comments = db.prepare(`
        SELECT c.*, u.email
        FROM comments c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.post_id = ? AND c.is_deleted = 0
        ORDER BY c.created_at ASC
      `).all(id);
      
      res.json({
        success: true,
        data: {
          ...post,
          comments
        }
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch post' });
    }
  });

  // Create new post (admin only)
  app.post('/api/posts', authMiddleware, (req, res) => {
    try {
      const user = req.user;
      
      if (user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      
      const { title, content, category, post_type, is_published, is_pinned, image_url, video_url, tags } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ success: false, error: 'Title and content are required' });
      }
      
      const result = db.prepare(`
        INSERT INTO posts (title, content, category, post_type, author_id, author_name, is_published, is_pinned, image_url, video_url, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        title,
        content,
        category || 'general',
        post_type || 'post',
        user.id,
        user.display_name || user.username,
        is_published ? 1 : 0,
        is_pinned ? 1 : 0,
        image_url || null,
        video_url || null,
        tags || null
      );
      
      res.json({
        success: true,
        data: { id: result.lastInsertRowid, message: 'Post created successfully' }
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ success: false, error: 'Failed to create post' });
    }
  });

  // Update post
  app.put('/api/posts/:id', authMiddleware, (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      // Check ownership or admin
      const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
      
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }
      
      if (user.role !== 'admin' && post.author_id !== user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to edit this post' });
      }
      
      const { title, content, category, post_type, is_published, is_pinned, image_url, video_url, tags } = req.body;
      
      db.prepare(`
        UPDATE posts
        SET title = ?, content = ?, category = ?, post_type = ?, is_published = ?, is_pinned = ?, image_url = ?, video_url = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title,
        content,
        category || post.category,
        post_type || post.post_type,
        is_published !== undefined ? (is_published ? 1 : 0) : post.is_published,
        is_pinned !== undefined ? (is_pinned ? 1 : 0) : post.is_pinned,
        image_url !== undefined ? image_url : post.image_url,
        video_url !== undefined ? video_url : post.video_url,
        tags !== undefined ? tags : post.tags,
        id
      );
      
      res.json({
        success: true,
        message: 'Post updated successfully'
      });
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ success: false, error: 'Failed to update post' });
    }
  });

  // Delete post
  app.delete('/api/posts/:id', authMiddleware, (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      // Check ownership or admin
      const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
      
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }
      
      if (user.role !== 'admin' && post.author_id !== user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this post' });
      }
      
      db.prepare('DELETE FROM posts WHERE id = ?').run(id);
      
      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ success: false, error: 'Failed to delete post' });
    }
  });

  // Add comment to post
  app.post('/api/posts/:id/comments', authMiddleware, (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ success: false, error: 'Comment content is required' });
      }
      
      // Check if post exists
      const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
      
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }
      
      const result = db.prepare(`
        INSERT INTO comments (post_id, content, author_id, author_name)
        VALUES (?, ?, ?, ?)
      `).run(id, content, user.id, user.name);
      
      res.json({
        success: true,
        data: { id: result.lastInsertRowid, message: 'Comment added successfully' }
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ success: false, error: 'Failed to add comment' });
    }
  });

  // Delete comment
  app.delete('/api/posts/:id/comments/:commentId', authMiddleware, (req, res) => {
    try {
      const { id, commentId } = req.params;
      const user = req.user;
      
      // Check ownership or admin
      const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND post_id = ?').get(commentId, id);
      
      if (!comment) {
        return res.status(404).json({ success: false, error: 'Comment not found' });
      }
      
      if (user.role !== 'admin' && comment.author_id !== user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
      }
      
      db.prepare('UPDATE comments SET is_deleted = 1 WHERE id = ?').run(commentId);
      
      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ success: false, error: 'Failed to delete comment' });
    }
  });

// ============================================
// Catch-all: serve 404 for non-existent routes
// ============================================
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found', error_kr: 'API 엔드포인트를 찾을 수 없습니다' });
  }
  // Serve 404 page for non-existent routes
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✝ 성경 사랑방 — Bible Glocal Server`);
  console.log(`🌐 Running at http://0.0.0.0:${PORT}`);
  console.log(`👤 Admin: st805@naver.com (Professor Jung)\n`);
});