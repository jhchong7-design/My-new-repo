require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { connectDB, User, Board, Media } = require('./database');
const { registerUser, loginUser, verifyToken, isAdmin, generateToken } = require('./auth');
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getRecentPosts
} = require('./boards');
const {
  upload,
  uploadMedia,
  getAllMedia,
  getMediaById,
  deleteMedia
} = require('./media');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
try {
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
} catch (e) { /* helmet optional */ }

// Request logging
try {
  const morgan = require('morgan');
  app.use(morgan('dev'));
} catch (e) { /* morgan optional */ }

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Connect to Database
connectDB();

// ============================================
// FAVICON (prevent 404 spam)
// ============================================
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.join(__dirname, '../public/favicon.ico');
  if (fs.existsSync(faviconPath)) {
    res.sendFile(faviconPath);
  } else {
    res.status(204).end();
  }
});

// ============================================
// AUTH ROUTES
// ============================================
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);

// Auth - /me route (used by pro-editor.js and app.js)
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .lean();
    
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      ...user,
      id: user._id,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '사용자 정보를 가져오는 중 오류가 발생했습니다.' 
    });
  }
});

// Auth - logout (JWT-based, client-side token removal)
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: '로그아웃되었습니다.' });
});

// ============================================
// BOARD ROUTES
// ============================================
app.get('/api/posts/recent', getRecentPosts);
app.get('/api/posts', getPosts);
app.get('/api/posts/:id', getPostById);
app.post('/api/posts', verifyToken, createPost);
app.put('/api/posts/:id', verifyToken, updatePost);
app.delete('/api/posts/:id', verifyToken, deletePost);

// ============================================
// MEDIA ROUTES
// ============================================
app.get('/api/media', getAllMedia);
app.get('/api/media/:id', getMediaById);
app.post('/api/media/upload', verifyToken, upload.single('file'), uploadMedia);
app.delete('/api/media/:id', verifyToken, deleteMedia);

// ============================================
// USER ROUTES
// ============================================
app.get('/api/users/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .lean();
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '사용자 정보를 가져오는 중 오류가 발생했습니다.' 
    });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================
app.get('/api/admin/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      totalPosts: await Board.countDocuments({ boardType: { $ne: 'page_content' } }),
      totalMedia: await Media.countDocuments(),
      noticeCount: await Board.countDocuments({ boardType: 'notice' }),
      koreanBibleCount: await Board.countDocuments({ boardType: 'korean_bible' }),
      worldBibleCount: await Board.countDocuments({ boardType: 'world_bible' }),
      booksPapersCount: await Board.countDocuments({ boardType: 'books_papers' }),
      openForumCount: await Board.countDocuments({ boardType: 'openforum' }),
      boardCount: await Board.countDocuments({ boardType: 'board' }),
      sermonCount: await Board.countDocuments({ boardType: 'sermon' })
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: '통계를 가져오는 중 오류가 발생했습니다.' 
    });
  }
});

// ============================================
// CONTENT PAGE ROUTES (used by pro-editor.js)
// ============================================
app.get('/api/content/page/:pageName', verifyToken, async (req, res) => {
  try {
    const content = await Board.findOne({ 
      boardType: 'page_content', 
      slug: req.params.pageName 
    }).lean();
    
    res.json({
      success: true,
      content: content || { blocks: [], pageName: req.params.pageName }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '콘텐츠 로드 오류' });
  }
});

app.post('/api/content/page/:pageName', verifyToken, async (req, res) => {
  try {
    const content = await Board.findOneAndUpdate(
      { boardType: 'page_content', slug: req.params.pageName },
      { 
        boardType: 'page_content',
        slug: req.params.pageName,
        title: `Page: ${req.params.pageName}`,
        content: JSON.stringify(req.body),
        author: req.userName || '관리자'
      },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, message: '콘텐츠 저장 오류' });
  }
});

// ============================================
// HTML PAGE ROUTES
// ============================================

// Admin unified dashboard
app.get('/admin-unified', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin-unified.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin-unified.html'));
});

// Known HTML pages
const htmlPages = [
  'about', 'empire', 'books', 'notices', 'gallery', 'operator', 
  'board', 'sermons', 'events', 'dashboard', 'church',
  'professor-main', 'professor-admin', 'professor-login', 'professor-register',
  'admin-login', 'test-editor', 'admin-old', 'admin-new'
];

htmlPages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    const filePath = path.join(__dirname, '../public', `${page}.html`);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.sendFile(path.join(__dirname, '../public', 'index.html'));
    }
  });
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Catch-all: serve index.html for non-file routes (SPA support)
app.get('*', (req, res) => {
  // If it's a file request (has extension), return 404
  if (path.extname(req.path)) {
    return res.status(404).send('Not found');
  }
  // Otherwise serve index.html (SPA fallback)
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: '서버 오류가 발생했습니다.' 
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});