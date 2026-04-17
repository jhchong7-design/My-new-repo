const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  name: { type: String, required: true },
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

// Generic Board Schema (for all board types)
const boardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, default: '관리자' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: { type: String, default: '일반' },
  boardType: { 
    type: String, 
    enum: ['notice', 'korean_bible', 'world_bible', 'books_papers', 'openforum', 'board', 'sermon', 'page_content', 'gallery'],
    required: true 
  },
  slug: { type: String, index: true },
  tags: [String],
  images: [String],
  videoUrl: String,
  views: { type: Number, default: 0 },
  attachment: String,
  isPinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
boardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Media Gallery Schema
const mediaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  mediaType: { type: String, enum: ['image', 'video'], required: true },
  url: { type: String, required: true },
  thumbnail: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: String,
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Create Models
const User = mongoose.model('User', userSchema);
const Board = mongoose.model('Board', boardSchema);
const Media = mongoose.model('Media', mediaSchema);

// MongoDB Connection
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mzchurch';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
    
    // Create default admin user if not exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        email: 'admin@professor.com',
        password: 'admin123', // Will be hashed automatically
        role: 'admin',
        name: '관리자',
        phone: '010-1234-5678'
      });
      await admin.save();
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

module.exports = {
  connectDB,
  User,
  Board,
  Media
};