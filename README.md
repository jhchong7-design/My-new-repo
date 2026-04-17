# ✝ Bible Glocal — 성경 사랑방

**Professor Jung Joong-Ho's Bible Study Website**
정중호 교수의 성경 사랑방 — bibleglocal.org

A bilingual (Korean/English) academic Bible study website featuring Korean thought & Bible, world thought & Bible, publications, open forum, and a full admin CMS.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start server
node server.js

# 3. Open browser
# http://localhost:3000
```

The server automatically creates the admin account and database on first run.

---

## 🔐 Admin Access

| Field | Value |
|-------|-------|
| Email | `st805@naver.com` |
| Password | `#9725` |
| Display Name | (청산) 정중호 |

After login, click the **✏️ button** (bottom-right) to enter edit mode.

---

## 📁 Project Structure

```
website/
├── server.js          # Express backend (auth, CMS APIs, static files)
├── package.json       # Dependencies & scripts
├── Dockerfile         # Docker deployment
├── railway.json       # Railway deployment config
├── render.yaml        # Render deployment config
├── .env.example       # Environment variables template
└── public/            # Static frontend files
    ├── index.html     # Homepage (Korean)
    ├── about.html     # About the Professor
    ├── korean-thought.html
    ├── world-thought.html
    ├── publications.html
    ├── forum.html
    ├── login.html
    ├── register.html
    ├── profile.html
    ├── admin.html
    ├── en/            # English versions (9 pages)
    ├── css/
    │   ├── style.css
    │   ├── auth.css
    │   ├── social.css
    │   └── admin-editor.css
    └── js/
        ├── main.js
        ├── auth.js
        ├── social.js
        └── admin-editor.js
```

---

## ☁️ Deployment Options

### Option 1: Railway (Recommended — Free Tier)

1. Go to [railway.app](https://railway.app) and sign up
2. Click **"New Project"** → **"Deploy from GitHub Repo"** or **"Upload"**
3. Upload the project folder or connect your repo
4. Railway auto-detects Node.js and deploys
5. Set environment variable: `JWT_SECRET` = any random string
6. Your site gets a public URL like `bibleglocal.up.railway.app`

### Option 2: Render (Free Tier)

1. Go to [render.com](https://render.com) and sign up
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repo or upload
4. Settings auto-detected from `render.yaml`
5. Click **"Create Web Service"**
6. Public URL: `bibleglocal.onrender.com`

### Option 3: Docker

```bash
# Build
docker build -t bibleglocal .

# Run
docker run -p 3000:3000 -v bibleglocal-data:/app/data bibleglocal
```

### Option 4: VPS (DigitalOcean, AWS, etc.)

```bash
# On your server
git clone <your-repo> && cd website
npm install
export JWT_SECRET="your-secret-key"
export PORT=80
node server.js

# Or with PM2 for auto-restart:
npm install -g pm2
pm2 start server.js --name bibleglocal
pm2 save
pm2 startup
```

---

## ⚙️ Tech Stack

- **Backend:** Node.js 20, Express 5
- **Database:** SQLite (better-sqlite3) — zero config
- **Auth:** JWT + bcrypt + httpOnly cookies
- **Frontend:** Vanilla HTML/CSS/JS (no framework)
- **CMS:** Custom inline editor (contentEditable API)
- **Social:** Kakao SDK, Naver, Daum, Facebook, X, LINE, TikTok, Band, Brunch
- **i18n:** Korean + English (19 pages total)

---

## 📋 Features

- ✅ 19 bilingual pages (10 Korean + 9 English)
- ✅ Admin CMS with inline text editing (200+ elements per page)
- ✅ Image upload & replacement
- ✅ Section reordering & visibility toggle
- ✅ User authentication (login, register, profile)
- ✅ Social media sharing (12 platforms)
- ✅ Responsive mobile design
- ✅ Open Graph & Twitter Card meta tags
- ✅ Keyboard shortcuts (Ctrl+S, Esc)
- ✅ Auto-save content to SQLite

---

© 2025 정중호 교수의 성경 사랑방 — Bible Glocal