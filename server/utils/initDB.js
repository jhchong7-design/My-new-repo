const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Content = require('../models/Content');
const Notice = require('../models/Notice');

require('dotenv').config();

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mzchurch', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'st805@naver.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('#9725', salt);
      
      const admin = new User({
        username: '정중호',
        email: 'st805@naver.com',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        profile: {
          fullName: '정중호',
          phone: '',
          joinDate: new Date()
        }
      });
      
      await admin.save();
      console.log('Admin user created successfully');
      console.log('Username: 정중호');
      console.log('Email: st805@naver.com');
      console.log('Password: #9725');
    }

    // Check if content exists
    const existingContent = await Content.countDocuments();
    
    if (existingContent === 0) {
      // Create initial content for homepage
      const adminUser = await User.findOne({ email: 'st805@naver.com' });
      
      // Welcome section
      const welcomeContent = new Content({
        page: 'home',
        section: 'welcome',
        title: '환영합니다',
        content: `<p>시온산교회 시온산제국에 오신 것을 환영합니다. 우리는 하나님의 말씀을 통해 영적으로 성장하고, 지역사회에 사랑을 나누는 교회 공동체입니다.</p>
                  <p>Welcome to Mount Zion Church & Empire. We are a church community that grows spiritually through God's word and shares love with our local community.</p>`,
        language: 'both',
        author: adminUser?._id,
        order: 0
      });
      
      await welcomeContent.save();
      
      // Create content for each page
      const pages = [
        {
          page: 'operator',
          section: 'introduction',
          title: '운영자 소개',
          content: `<p><strong>정중호</strong></p>
                    <p>시온산교회 시온산제국을 설립하고 이끌고 있습니다. 하나님의 사랑을 실천하며 공동체를 섬기고 있습니다.</p>
                    <p><strong>Jung Jung-ho</strong></p>
                    <p>Founder and leader of Mount Zion Church & Empire. Serving the community through God's love and dedication.</p>`,
          order: 0
        },
        {
          page: 'church',
          section: 'about',
          title: '시온산교회 소개',
          content: `<p><strong>비전</strong></p>
                    <p>하나님 나라의 확장과 제자 양성에 헌신하는 교회</p>
                    <p><strong>Vision</strong></p>
                    <p>A church committed to expanding God's kingdom and discipling believers.</p>
                    <p><strong>예배 시간</strong></p>
                    <p>• 주일 낮 예배: 오전 11시</p>
                    <p>• 수요 예배: 오후 7시</p>
                    <p>• 금요 기도회: 오후 8시</p>`,
          order: 0
        },
        {
          page: 'empire',
          section: 'about',
          title: '시온산제국 소개',
          content: `<p>시온산제국은 하나님의 말씀에 근거하여 설립된 기독교 조직입니다.</p>
                    <p>우리는 진리를 탐구하고, 사랑을 실천하며, 공동체를 세우는 데 헌신하고 있습니다.</p>
                    <p>Mount Zion Empire is a Christian organization founded on God's Word.</p>
                    <p>We are committed to seeking truth, practicing love, and building community.</p>`,
          order: 0
        },
        {
          page: 'books',
          section: 'publications',
          title: '책과 논문',
          content: `<p><strong>출판물</strong></p>
                    <p>시온산교회 시온산제국의 다양한 출판물과 자료를 제공합니다.</p>
                    <p><strong>Publications</strong></p>
                    <p>Various publications and resources from Mount Zion Church & Empire.</p>
                    <p>📚 다양한 신학 서적과 연구 논문이 준비되어 있습니다.</p>
                    <p>📚 Various theological books and research papers are available.</p>`,
          order: 0
        }
      ];
      
      for (const pageData of pages) {
        const content = new Content({
          ...pageData,
          language: 'both',
          author: adminUser?._id
        });
        await content.save();
      }
      
      console.log('Initial content created successfully');
    }

    // Check if notices exist
    const existingNotices = await Notice.countDocuments();
    
    if (existingNotices === 0) {
      const adminUser = await User.findOne({ email: 'st805@naver.com' });
      
      const notices = [
        {
          title: '시온산교회 시온산제국 웹사이트 개설',
          content: `<p>하나님 감사합니다! 시온산교회 시온산제국의 웹사이트가 개설되었습니다.</p>
                    <p>많은 방문과 관심 부탁드립니다.</p>`,
          category: 'general',
          isPinned: true,
          author: adminUser?._id
        },
        {
          title: 'Welcome to Mount Zion Church & Empire',
          content: `<p>Thank you God! The website for Mount Zion Church & Empire has been launched.</p>
                    <p>We appreciate your visits and interest.</p>`,
          category: 'event',
          author: adminUser?._id
        }
      ];
      
      for (const noticeData of notices) {
        const notice = new Notice(noticeData);
        await notice.save();
      }
      
      console.log('Initial notices created successfully');
    }

    console.log('\n✅ Database initialization completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Username: 정중호');
    console.log('   Email: st805@naver.com');
    console.log('   Password: #9725');
    console.log('\n🌐 Admin Panel: http://localhost:3000/admin');
    console.log('🌐 Public Site: http://localhost:3000');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();