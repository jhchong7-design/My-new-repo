const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { readFile, writeFile, DATA_FILES } = require('../config/simple-db');
const { protect, authorize } = require('../middleware/auth');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'media-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

// Upload media (admin only)
router.post('/upload', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const media = {
      _id: `media${Date.now()}`,
      url: `/uploads/${req.file.filename}`,
      type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
      title: req.body.title || req.file.originalname,
      caption: req.body.caption || '',
      author: req.user._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Save to database
    const mediaList = await readFile(DATA_FILES.media);
    mediaList.push(media);
    await writeFile(DATA_FILES.media, mediaList);

    // Return with author info
    const users = await readFile(DATA_FILES.users);
    media.author = users.find(u => u._id === media.author)?.username || 'Unknown';

    res.status(201).json({
      ...media,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
});

// Upload multiple media (admin only)
router.post('/upload-multiple', protect, authorize('admin'), upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const users = await readFile(DATA_FILES.users);
    const mediaList = await readFile(DATA_FILES.media);
    const uploadedMedia = [];

    for (const file of req.files) {
      const media = {
        _id: `media${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: `/uploads/${file.filename}`,
        type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        title: file.originalname,
        caption: '',
        author: req.user._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };

      media.author = users.find(u => u._id === media.author)?.username || 'Unknown';
      mediaList.push(media);
      uploadedMedia.push(media);
    }

    await writeFile(DATA_FILES.media, mediaList);

    res.status(201).json({
      media: uploadedMedia,
      message: `${uploadedMedia.length} files uploaded successfully`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload files' });
  }
});

// Delete media file (admin only)
router.delete('/file/:filename', protect, authorize('admin'), async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from database
    const mediaList = await readFile(DATA_FILES.media);
    const filteredMedia = mediaList.filter(m => !m.url.includes(filename));
    await writeFile(DATA_FILES.media, filteredMedia);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

// Get upload status
router.get('/status', protect, authorize('admin'), async (req, res) => {
  try {
    const mediaList = await readFile(DATA_FILES.media);
    const uploadCount = mediaList.length;
    const totalSize = mediaList.reduce((sum, m) => {
      try {
        const filePath = path.join(uploadDir, path.basename(m.url));
        if (fs.existsSync(filePath)) {
          return sum + fs.statSync(filePath).size;
        }
      } catch (e) {
        // Ignore file stat errors
      }
      return sum;
    }, 0);

    res.json({
      totalFiles: uploadCount,
      totalSize: totalSize,
      totalSizeInMB: (totalSize / (1024 * 1024)).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get upload status' });
  }
});

module.exports = router;