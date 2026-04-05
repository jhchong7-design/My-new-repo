const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const { connectDB, User } = require('./database');
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

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Connect to Database
connectDB();

// Auth Routes
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);

// Board Routes
app.get('/api/posts/recent', getRecentPosts);
app.get('/api/posts', getPosts);
app.get('/api/posts/:id', getPostById);
app.post('/api/posts', verifyToken, createPost);
app.put('/api/posts/:id', verifyToken, updatePost);
app.delete('/api/posts/:id', verifyToken, deletePost);

// Media Routes
app.get('/api/media', getAllMedia);
app.get('/api/media/:id', getMediaById);
app.post('/api/media/upload', verifyToken, upload.single('file'), uploadMedia);
app.delete('/api/media/:id', verifyToken, deleteMedia);

// User Routes
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

// Admin Routes
app.get('/api/admin/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      totalPosts: await require('./database').Board.countDocuments(),
      totalMedia: await require('./database').Media.countDocuments(),
      noticeCount: await require('./database').Board.countDocuments({ boardType: 'notice' }),
      koreanBibleCount: await require('./database').Board.countDocuments({ boardType: 'korean_bible' }),
      worldBibleCount: await require('./database').Board.countDocuments({ boardType: 'world_bible' }),
      booksPapersCount: await require('./database').Board.countDocuments({ boardType: 'books_papers' }),
      openForumCount: await require('./database').Board.countDocuments({ boardType: 'openforum' }),
      boardCount: await require('./database').Board.countDocuments({ boardType: 'board' })
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '통계를 가져오는 중 오류가 발생했습니다.' 
    });
  }
});

// Serve HTML files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: '서버 오류가 발생했습니다.' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});