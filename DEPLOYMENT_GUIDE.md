# Bible Study Website - Deployment Guide

## 🚀 Quick Start

### Local Development
```bash
cd website
npm install
node server.js
```

The website will be available at: http://localhost:3000

### Production Deployment

#### Option 1: Direct Deployment
```bash
cd website
npm install --production
node server.js
```

#### Option 2: Using PM2 (Recommended)
```bash
npm install -g pm2
cd website
pm2 start server.js --name "bible-website"
pm2 save
pm2 startup
```

## 📁 Project Structure

```
website/
├── css/
│   ├── modern-framework.css      # Core CSS framework
│   └── bible-website.css          # Website-specific styles
├── js/
│   └── bible-website.js           # Main JavaScript functionality
├── index.html                     # Main homepage
├── index-completed.html           # Complete version backup
├── server.js                      # Node.js backend server
├── bibleglocal.db                 # SQLite database
├── init_db.js                     # Database initialization script
├── package.json                   # Node.js dependencies
└── production.log                 # Server logs
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the website directory:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secret-key-here
```

### Database
The database is automatically initialized on first run. To reset:

```bash
cd website
rm -f bibleglocal.db bibleglocal.db-shm bibleglocal.db-wal
node init_db.js
```

## 👤 Default Accounts

### Administrator
- Email: `st805@naver.com`
- Password: `admin123`
- Role: Full admin access

### Regular Member
- Email: `member@example.com`
- Password: `password123`
- Role: Member access

## 🌐 Access URLs

### Local Development
- Main Website: http://localhost:3000
- Admin Panel: http://localhost:3000/admin.html
- API: http://localhost:3000/api/*

### Public Access (via Tunnel)
- Main Website: https://00rp6.app.super.myninja.ai/
- Admin Panel: https://00rp6.app.super.myninja.ai/admin.html

## 📊 Features

### ✅ Completed Features
1. **Responsive Design** - Works on mobile, tablet, and desktop
2. **Authentication** - Login, registration, session management
3. **Content Management** - 7 categories with recent posts
4. **Admin Dashboard** - Statistics and quick posting
5. **Modern UI/UX** - Professional design with animations
6. **Bilingual Support** - Korean and English
7. **SEO Optimized** - Meta tags and semantic HTML

### 🎨 Design Highlights
- **Color Scheme**: Earth tones (green/gold)
- **Typography**: Pretendard (Korean-optimized)
- **Layout**: Card-based grid system
- **Animations**: Smooth transitions and hover effects
- **Responsiveness**: Mobile-first approach

## 🔒 Security

- JWT token authentication
- Password hashing with bcrypt
- SQL injection prevention
- XSS protection
- CSRF protection ready

## 📈 Monitoring

### Check Server Status
```bash
ps aux | grep "node server.js"
```

### View Logs
```bash
tail -f production.log
```

### Check Database
```bash
sqlite3 bibleglocal.db "SELECT COUNT(*) FROM users;"
sqlite3 bibleglocal.db "SELECT COUNT(*) FROM posts;"
```

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port is in use
lsof -i :3000

# Kill process
kill -9 <PID>

# Restart server
node server.js
```

### Database Issues
```bash
# Reinitialize database
rm -f bibleglocal.db bibleglocal.db-shm bibleglocal.db-wal
node init_db.js
```

### CSS Not Loading
- Check file paths in index.html
- Verify CSS files exist in css/ directory
- Check browser console for errors

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify` - Verify token

### Posts
- `GET /api/posts/recent` - Get recent posts
- `GET /api/posts/category/:category` - Get posts by category
- `POST /api/posts` - Create post (auth required)
- `PUT /api/posts/:id` - Update post (auth required)
- `DELETE /api/posts/:id` - Delete post (auth required)

### Admin
- `GET /api/admin/stats` - Get statistics (admin required)

## 🎯 Testing Checklist

### Functionality Tests
- [ ] Homepage loads correctly
- [ ] Mobile menu works
- [ ] Login modal opens
- [ ] Registration works
- [ ] Recent posts display
- [ ] Admin dashboard shows (for admin user)
- [ ] Quick post modal works (for admin user)
- [ ] Scroll to top button works
- [ ] Smooth scroll navigation
- [ ] Footer links work

### Responsive Tests
- [ ] Mobile view (< 640px)
- [ ] Tablet view (640px - 1024px)
- [ ] Desktop view (> 1024px)
- [ ] Large desktop view (> 1280px)

### Browser Tests
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari
- [ ] Chrome Mobile

## 📚 Additional Resources

### Documentation
- `WEBSITE_COMPLETION_REPORT.md` - Complete project report
- `LOGIN_FIX_COMPLETE.md` - Login system fix report
- `README.md` - General project information

### Support
For issues or questions:
- Email: st805@naver.com
- Website: bibleglocal.org

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Review all content
- [ ] Test all functionality
- [ ] Verify responsive design
- [ ] Check SEO meta tags
- [ ] Test authentication
- [ ] Verify admin functionality
- [ ] Check database connections
- [ ] Review security settings
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Update documentation
- [ ] Test deployment environment

## 🎉 Success!

Your Bible Study website is now ready for deployment!

**Status**: Production Ready
**Version**: 1.0.0
**Last Updated**: 2025-04-07

---

**For technical support, refer to the documentation files or contact the development team.**