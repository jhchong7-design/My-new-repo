const fs = require('fs').promises;
const path = require('path');

const DB_DIR = path.join(__dirname, '../../data');
const DATA_FILES = {
  users: path.join(DB_DIR, 'users.json'),
  contents: path.join(DB_DIR, 'contents.json'),
  notices: path.join(DB_DIR, 'notices.json'),
  posts: path.join(DB_DIR, 'posts.json'),
  media: path.join(DB_DIR, 'media.json')
};

// Initialize data directory and files
async function initDB() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    
    // Initialize admin user
    const bcrypt = require('bcryptjs');
    const adminUser = {
      _id: 'admin001',
      username: '정중호',
      email: 'st805@naver.com',
      password: await bcrypt.hash('#9725', 10),
      role: 'admin',
      isVerified: true,
      profile: {
        fullName: '정중호',
        joinDate: new Date().toISOString()
      },
      createdAt: new Date().toISOString()
    };

    // Initialize with sample data if files don't exist
    await initializeFile(DATA_FILES.users, [adminUser]);
    await initializeFile(DATA_FILES.contents, getSampleContents());
    await initializeFile(DATA_FILES.notices, getSampleNotices());
    await initializeFile(DATA_FILES.posts, []);
    await initializeFile(DATA_FILES.media, []);

    console.log('Simple database initialized');
  } catch (error) {
    console.error('Error initializing database:', error.message);
  }
}

async function initializeFile(filePath, defaultData) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    console.log(`Created: ${path.basename(filePath)}`);
  }
}

async function readFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Sample content
function getSampleContents() {
  return [
    {
      _id: 'content001',
      page: 'home',
      section: 'welcome',
      title: '환영합니다',
      content: '<p>시온산교회 시온산제국에 오신 것을 환영합니다.</p>',
      language: 'both',
      author: 'admin001',
      isActive: true,
      order: 0,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'content002',
      page: 'operator',
      section: 'intro',
      title: '운영자 소개',
      content: '<p><strong>정중호</strong><br>시온산교회 시온산제국을 설립하고 이끌고 있습니다.</p>',
      language: 'both',
      author: 'admin001',
      isActive: true,
      order: 0,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'content003',
      page: 'church',
      section: 'about',
      title: '시온산교회 소개',
      content: '<p>하나님의 말씀을 통해 영적으로 성장하는 교회입니다.</p>',
      language: 'both',
      author: 'admin001',
      isActive: true,
      order: 0,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'content004',
      page: 'empire',
      section: 'about',
      title: '시온산제국 소개',
      content: '<p>하나님의 말씀에 근거하여 설립된 기독교 조직입니다.</p>',
      language: 'both',
      author: 'admin001',
      isActive: true,
      order: 0,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'content005',
      page: 'books',
      section: 'papers',
      title: '책과 논문',
      content: '<p>시온산교회 시온산제국의 다양한 출판물과 자료를 제공합니다.</p>',
      language: 'both',
      author: 'admin001',
      isActive: true,
      order: 0,
      createdAt: new Date().toISOString()
    }
  ];
}

function getSampleNotices() {
  return [
    {
      _id: 'notice001',
      title: '시온산교회 시온산제국 웹사이트 개설',
      content: '<p>하나님 감사합니다! 시온산교회 시온산제국의 웹사이트가 개설되었습니다.</p>',
      author: 'admin001',
      category: 'general',
      isPinned: true,
      isActive: true,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'notice002',
      title: 'Welcome to Mount Zion Church & Empire',
      content: '<p>Welcome to our website!</p>',
      author: 'admin001',
      category: 'event',
      isPinned: false,
      isActive: true,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

module.exports = {
  initDB,
  readFile,
  writeFile,
  DATA_FILES
};