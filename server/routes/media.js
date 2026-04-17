const express = require('express');
const router = express.Router();
const Media = require('../models/Media');
const { protect, authorize } = require('../middleware/auth');

// Get all media (public)
router.get('/', async (req, res) => {
  try {
    const { type, category } = req.query;
    
    let query = { isActive: true };
    
    if (type) {
      query.type = type;
    }
    
    if (category) {
      query.category = category;
    }
    
    const media = await Media.find(query)
      .populate('uploadedBy', 'username')
      .sort({ order: 1, createdAt: -1 });
    
    res.json(media);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single media
router.get('/:id', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)
      .populate('uploadedBy', 'username');
    
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    
    res.json(media);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create media (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const media = new Media({
      ...req.body,
      uploadedBy: req.user._id
    });
    
    await media.save();
    await media.populate('uploadedBy', 'username');
    
    res.status(201).json(media);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update media (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const media = await Media.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'username');
    
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    
    res.json(media);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete media (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const media = await Media.findByIdAndDelete(req.params.id);
    
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    
    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;