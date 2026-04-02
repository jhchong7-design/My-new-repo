const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const { protect, authorize } = require('../middleware/auth');

// Get all content for a page
router.get('/page/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const content = await Content.find({ 
      page, 
      isActive: true 
    })
    .populate('author', 'username')
    .sort({ order: 1, createdAt: -1 });
    
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all content (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const content = await Content.find()
      .populate('author', 'username')
      .sort({ page: 1, order: 1, createdAt: -1 });
    
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single content by ID
router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('author', 'username');
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new content (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const content = new Content({
      ...req.body,
      author: req.user._id
    });
    
    await content.save();
    await content.populate('author', 'username');
    
    res.status(201).json(content);
  } catch (error) {
    console.error('Content creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update content (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'username');
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete content (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;