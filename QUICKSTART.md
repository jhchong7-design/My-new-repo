# ⚡ Quick Start Guide - 시온산교회 시온산제국 웹사이트

Get your Mount Zion Church & Empire website running in 5 minutes!

## 🚀 Express Setup (Local Development)

### Step 1: Install Prerequisites

Make sure you have:
- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)

Check versions:
```bash
node --version  # Should be v14+
mongod --version  # Should be v4.4+
```

### Step 2: Install Dependencies

```bash
cd mzchurch
npm install
```

### Step 3: Start MongoDB

**On Linux/Ubuntu:**
```bash
sudo systemctl start mongod
```

**On macOS:**
```bash
brew services start mongodb-community
```

**On Windows:**
```bash
# Run MongoDB from Services or Start Menu
```

### Step 4: Initialize Database

```bash
node server/utils/initDB.js
```

This creates:
- ✅ Admin account (정중호 / st805@naver.com / #9725)
- ✅ Initial content for all pages
- ✅ Sample notices

### Step 5: Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### Step 6: Access Your Website

Open your browser:
- 🌐 **Public Website**: http://localhost:3000
- 👑 **Admin Panel**: http://localhost:3000/admin
- 🔐 **Admin Login**: http://localhost:3000/admin/login

---

## 🔐 Login Credentials

### Admin Account
- **Username**: 정중호
- **Email**: st805@naver.com
- **Password**: #9725

### Member Registration
Click "회원가입" (Sign Up) on the homepage to create a new member account.

---

## 📱 Testing the Website

### 1. Test Public Features
- [ ] Navigate through all menu items
- [ ] Test social media share buttons
- [ ] Try responsive design (resize browser)
- [ ] View notices and posts

### 2. Test Member Features
- [ ] Register as a new member
- [ ] Login with credentials
- [ ] Create a post in the discussion board
- [ ] Leave a comment
- [ ] Like a post

### 3. Test Admin Features
- [ ] Login as admin (정중호)
- [ ] Edit page content
- [ ] Create a new notice
- [ ] Upload an image/video
- [ ] Manage users

---

## 🛠️ Common Commands

```bash
# Start the server
npm start

# Start in development mode
npm run dev

# Initialize database (creates admin & initial content)
node server/utils/initDB.js

# Install dependencies
npm install

# Check for vulnerabilities
npm audit
```

---

## 🌐 Deployment

For production deployment, see **DEPLOYMENT.md**

Quick deployment options:
- **VPS**: DigitalOcean, AWS, GCP
- **PaaS**: Heroku, Railway
- **Docker**: See DEPLOYMENT.md

---

## 🐛 Troubleshooting

### Port 3000 already in use?
```bash
# Kill process on port 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=8080 npm start
```

### MongoDB connection failed?
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

### Dependencies not installing?
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Admin login not working?
```bash
# Reinitialize database (this resets everything)
node server/utils/initDB.js
```

---

## 📚 Full Documentation

- **README.md** - Complete setup and features guide
- **DEPLOYMENT.md** - Production deployment instructions
- **PROJECT_SUMMARY.md** - Project completion report

---

## 🎉 You're Ready!

Your Mount Zion Church & Empire website is now running!

Start customizing:
1. Login as admin: http://localhost:3000/admin/login
2. Edit content in the admin panel
3. Add your own images and videos
4. Create notices for your community
5. Invite members to register

---

## 📞 Need Help?

- **Email**: st805@naver.com
- **Admin**: 정중호
- **GitHub**: https://github.com/jhchong7-design/My-new-repo

---

**시온산교회 시온산제국 | Mount Zion Church & Empire**

하나님의 말씀을 전파하고, 그리스도의 사랑을 실천합니다.
Spreading God's word and practicing Christ's love.