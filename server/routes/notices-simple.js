const express = require('express');
const router = express.Router();
const { readFile, writeFile, DATA_FILES } = require('../config/simple-db');
const { protect, authorize } = require('../middleware/auth');

// Get all notices (public)
router.get('/', async (req, res) => {
  try {
    const { category, limit } = req.query;
    let notices = await readFile(DATA_FILES.notices);
    const users = await readFile(DATA_FILES.users);
    
    notices = notices.filter(n => n.isActive);
    
    if (category) {
      notices = notices.filter(n => n.category === category);
    }
    
    notices = notices.sort((a, b) => {
      if (b.isPinned !== a.isPinned) return b.isPinned - a.isPinned;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    if (limit) {
      notices = notices.slice(0, parseInt(limit));
    }
    
    notices = notices.map(notice => ({
      ...notice,
      author: users.find(u => u._id === notice.author)?.username || 'Unknown'
    }));
    
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single notice
router.get('/:id', async (req, res) => {
  try {
    const notices = await readFile(DATA_FILES.notices);
    const users = await readFile(DATA_FILES.users);
    const index = notices.findIndex(n => n._id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    notices[index].views = (notices[index].views || 0) + 1;
    await writeFile(DATA_FILES.notices, notices);
    
    notices[index].author = users.find(u => u._id === notices[index].author)?.username || 'Unknown';
    res.json(notices[index]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create notice (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const notices = await readFile(DATA_FILES.notices);
    const notice = {
      _id: `notice${Date.now()}`,
      ...req.body,
      author: req.user._id,
      isActive: req.body.isActive ?? true,
      isPinned: req.body.isPinned ?? false,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    notices.push(notice);
    await writeFile(DATA_FILES.notices, notices);
    
    const users = await readFile(DATA_FILES.users);
    notice.author = users.find(u => u._id === notice.author)?.username || 'Unknown';
    
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update notice (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const notices = await readFile(DATA_FILES.notices);
    const index = notices.findIndex(n => n._id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    notices[index] = {
      ...notices[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await writeFile(DATA_FILES.notices, notices);
    
    const users = await readFile(DATA_FILES.users);
    notices[index].author = users.find(u => u._id === notices[index].author)?.username || 'Unknown';
    
    res.json(notices[index]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notice (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const notices = await readFile(DATA_FILES.notices);
    const index = notices.findIndex(n => n._id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    notices.splice(index, 1);
    await writeFile(DATA_FILES.notices, notices);
    
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;