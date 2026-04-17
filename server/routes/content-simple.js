const express = require('express');
const router = express.Router();
const { readFile, writeFile, DATA_FILES } = require('../config/simple-db');
const { protect, authorize } = require('../middleware/auth');

// Get all content for a page
router.get('/page/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const contents = await readFile(DATA_FILES.contents);
    const users = await readFile(DATA_FILES.users);
    
    const content = contents
      .filter(c => c.page === page && c.isActive)
      .map(c => ({
        ...c,
        author: users.find(u => u._id === c.author)?.username || 'Unknown'
      }))
      .sort((a, b) => a.order - b.order);
    
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all content (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const contents = await readFile(DATA_FILES.contents);
    const users = await readFile(DATA_FILES.users);
    
    const contentWithAuthors = contents.map(c => ({
      ...c,
      author: users.find(u => u._id === c.author)?.username || 'Unknown'
    })).sort((a, b) => {
      if (a.page !== b.page) return a.page.localeCompare(b.page);
      return a.order - b.order;
    });
    
    res.json(contentWithAuthors);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single content by ID
router.get('/:id', async (req, res) => {
  try {
    const contents = await readFile(DATA_FILES.contents);
    const users = await readFile(DATA_FILES.users);
    const content = contents.find(c => c._id === req.params.id);
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    content.author = users.find(u => u._id === content.author)?.username || 'Unknown';
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new content (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const contents = await readFile(DATA_FILES.contents);
    const content = {
      _id: `content${Date.now()}`,
      ...req.body,
      author: req.user._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    contents.push(content);
    await writeFile(DATA_FILES.contents, contents);
    
    const users = await readFile(DATA_FILES.users);
    content.author = users.find(u => u._id === content.author)?.username || 'Unknown';
    
    res.status(201).json(content);
  } catch (error) {
    console.error('Content creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update content (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const contents = await readFile(DATA_FILES.contents);
    const index = contents.findIndex(c => c._id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    contents[index] = {
      ...contents[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await writeFile(DATA_FILES.contents, contents);
    
    const users = await readFile(DATA_FILES.users);
    contents[index].author = users.find(u => u._id === contents[index].author)?.username || 'Unknown';
    
    res.json(contents[index]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete content (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const contents = await readFile(DATA_FILES.contents);
    const index = contents.findIndex(c => c._id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    contents.splice(index, 1);
    await writeFile(DATA_FILES.contents, contents);
    
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;