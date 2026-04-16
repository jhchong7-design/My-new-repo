const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

// Simple UUID generator function
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const db = new Database(path.join(__dirname, 'bible.db'));

console.log('🔧 Initializing database tables...');

try {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      display_name TEXT,
      avatar_url TEXT,
      provider TEXT,
      provider_id TEXT,
      last_login DATETIME,
      bio TEXT,
      is_active INT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      post_type TEXT NOT NULL DEFAULT 'post',
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      views INT DEFAULT 0,
      likes INT DEFAULT 0,
      pinned INT DEFAULT 0,
      is_published INT DEFAULT 1,
      is_pinned INT DEFAULT 0,
      image_url TEXT,
      video_url TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `);

  // Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      author_id TEXT,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `);

  // Visits table
  db.exec(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT,
      user_agent TEXT,
      page TEXT,
      visit_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Check and create default users if none exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  
  if (userCount.count === 0) {
    console.log('📝 Creating default users...');
    
    // Admin user
    const adminId = generateUUID();
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, role, display_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(adminId, 'st805@naver.com', 'admin', adminPassword, 'admin', '(청산) 정중호');

    // Regular member user
    const memberId = generateUUID();
    const memberPassword = bcrypt.hashSync('password123', 10);
    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, role, display_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(memberId, 'member@example.com', 'member', memberPassword, 'member', '일반 회원');

    console.log('✅ Default users created successfully');
    console.log('   Admin: st805@naver.com / admin123');
    console.log('   Member: member@example.com / password123');
  } else {
    console.log(`ℹ️  ${userCount.count} users already exist in database`);
  }

  console.log('✅ Database initialization completed successfully');
} catch (error) {
  console.error('❌ Database initialization error:', error);
  process.exit(1);
}

db.close();