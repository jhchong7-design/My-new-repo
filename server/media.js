const { Media } = require('./database');
const fs = require('fs');
const path = require('path');

// Multer setup for file uploads
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  }
});

// Upload Media
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: '파일이 업로드되지 않았습니다.' 
      });
    }

    const { title, description, category } = req.body;
    
    // Determine media type
    const ext = path.extname(req.file.filename).toLowerCase();
    const mediaType = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext) ? 'image' : 'video';

    const media = new Media({
      title: title || req.file.originalname,
      description,
      mediaType,
      url: `/uploads/${req.file.filename}`,
      thumbnail: mediaType === 'video' ? null : `/uploads/${req.file.filename}`,
      uploadedBy: req.userId,
      category
    });

    await media.save();

    res.status(201).json({
      success: true,
      message: '미디어가 업로드되었습니다.',
      media
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ 
      success: false, 
      message: '미디어 업로드 중 오류가 발생했습니다.' 
    });
  }
};

// Get All Media
const getAllMedia = async (req, res) => {
  try {
    const { type, page = 1, limit = 12, category } = req.query;
    
    const query = {};
    if (type) query.mediaType = type;
    if (category) query.category = category;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;

    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    const total = await Media.countDocuments(query);

    res.json({
      success: true,
      media,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalMedia: total
      }
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ 
      success: false, 
      message: '미디어 가져오기 중 오류가 발생했습니다.' 
    });
  }
};

// Get Media by ID
const getMediaById = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id).lean();

    if (!media) {
      return res.status(404).json({ 
        success: false, 
        message: '미디어를 찾을 수 없습니다.' 
      });
    }

    // Increment view count
    await Media.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({
      success: true,
      media
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ 
      success: false, 
      message: '미디어 가져오기 중 오류가 발생했습니다.' 
    });
  }
};

// Delete Media
const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ 
        success: false, 
        message: '미디어를 찾을 수 없습니다.' 
      });
    }

    // Check ownership or admin
    if (media.uploadedBy && media.uploadedBy.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '삭제 권한이 없습니다.' 
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../public', media.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Media.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '미디어가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ 
      success: false, 
      message: '미디어 삭제 중 오류가 발생했습니다.' 
    });
  }
};

module.exports = {
  upload,
  uploadMedia,
  getAllMedia,
  getMediaById,
  deleteMedia
};