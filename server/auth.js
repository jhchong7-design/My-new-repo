const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register User
const registerUser = async (req, res) => {
  try {
    const { username, email, password, name, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: '이미 존재하는 사용자입니다.' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password, // Will be hashed by pre-save hook
      name,
      phone
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: '회원가입 중 오류가 발생했습니다.' 
    });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '아이디 또는 비밀번호가 일치하지 않습니다.' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: '아이디 또는 비밀번호가 일치하지 않습니다.' 
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: '로그인이 완료되었습니다.',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: '로그인 중 오류가 발생했습니다.' 
    });
  }
};

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      message: '인증 토큰이 없습니다.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: '유효하지 않은 토큰입니다.' 
    });
  }
};

// Check Admin Role Middleware
const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: '관리자 권한이 필요합니다.' 
    });
  }
  next();
};

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  isAdmin,
  generateToken
};