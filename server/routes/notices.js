const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { protect, authorize } = require('../middleware/auth');

// Get all notices (public)
router.get('/', async (req, res) => {
  try {
    const { category, limit } = req.query;
    
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    let notices = await Notice.find(query)
      .populate('author', 'username')
      .sort({ isPinned: -1, createdAt: -1 });
    
    if (limit) {
      notices = notices.slice(0, parseInt(limit));
    }
    
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single notice
router.get('/:id', async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'username');
    
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create notice (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const notice = new Notice({
      ...req.body,
      author: req.user._id
    });
    
    await notice.save();
    await notice.populate('author', 'username');
    
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update notice (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'username');
    
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notice (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;