// Mock database for testing without MongoDB
// This provides in-memory storage for demonstration

const users = [];
const contents = [];
const notices = [];
const posts = [];
const media = [];

// Mock admin user
const adminUser = {
  _id: 'admin123',
  username: '정중호',
  email: 'st805@naver.com',
  password: await bcrypt.hash('#9725', 10),
  role: 'admin',
  profile: {
    fullName: '정중호',
    joinDate: new Date()
  },
  createdAt: new Date()
};

users.push(adminUser);

console.log('Using mock database (in-memory storage)');
console.log('NOTE: This is for testing only. Use MongoDB for production.');

module.exports = {
  users,
  contents,
  notices,
  posts,
  media
};