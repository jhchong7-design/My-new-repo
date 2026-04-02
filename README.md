# 시온산교회 시온산제국 웹사이트
# Mount Zion Church & Empire Website

A comprehensive, fully functional website for Mount Zion Church & Empire with full admin capabilities, member system, and social media integration.

## 🌟 Features

### Public Features
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Bilingual Support**: Korean and English content
- **Navigation Menu**: 6 main sections with sub-menus
  - 운영자소개 (Administrator Introduction)
  - 시온산교회 (Mount Zion Church)
  - 시온산제국 (Mount Zion Empire)
  - 책과논문 (Books & Papers)
  - 열린마당 (Open Forum):
    - 공지사항 (Notices)
    - 게시판 (Discussion Board)
    - 이미지&동영상 (Images & Videos)

### Social Media Integration
- **Korean Platforms**: Naver, Daum, Kakao
- **International Platforms**: Facebook, Twitter, LinkedIn
- Share buttons on all pages

### Member System
- User registration with email/username
- Login functionality
- Member dashboard
- Profile management
- Password recovery

### Admin Panel
- Full content management system (CMS)
- Page editor for all sections
- Notice management
- Post moderation
- Image/video upload
- User management
- System settings
- Complete admin privileges

## 📋 Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Responsive design with CSS Grid/Flexbox
- No external frameworks for maximum compatibility

### Backend
- Node.js with Express.js
- MongoDB for data storage
- JWT authentication
- Session management
- RESTful API

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Step 1: Install Dependencies

```bash
cd mzchurch
npm install
```

### Step 2: Configure Environment Variables

The `.env` file is already configured with:
- PORT: 3000
- MongoDB URI
- JWT secrets
- Email configuration

Note: Make sure MongoDB is running locally or update the `MONGODB_URI` in `.env` to your MongoDB connection string.

### Step 3: Initialize Database

```bash
node server/utils/initDB.js
```

This will create:
- Admin account with specified credentials
- Initial content for all pages
- Sample notices

### Step 4: Start Development Server

```bash
npm run dev
```

Or for production:

```bash
npm start
```

## 🔐 Admin Credentials

After running the initialization script, use these credentials to access the admin panel:

- **Username**: 정중호
- **Email**: st805@naver.com
- **Password**: #9725

Admin Panel URL: `http://localhost:3000/admin`

## 📁 Project Structure

```
mzchurch/
├── public/
│   ├── css/
│   │   └── styles.css          # Main stylesheet
│   ├── js/
│   │   └── app.js              # Frontend JavaScript
│   ├── uploads/                # User uploads
│   ├── index.html              # Homepage
│   ├── admin.html              # Admin dashboard
│   └── admin-login.html        # Admin login
├── server/
│   ├── config/
│   │   └── database.js         # Database configuration
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── Content.js          # Content model
│   │   ├── Notice.js           # Notice model
│   │   ├── Post.js             # Post model
│   │   └── Media.js            # Media model
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── content.js          # Content routes
│   │   ├── notices.js          # Notice routes
│   │   ├── posts.js            # Post routes
│   │   ├── media.js            # Media routes
│   │   └── users.js            # User routes
│   ├── middleware/
│   │   └── auth.js             # Authentication middleware
│   ├── utils/
│   │   └── initDB.js           # Database initialization
│   └── index.js                # Main server file
├── .env                        # Environment variables
├── package.json
└── README.md
```

## 🌐 Access Points

After starting the server, access the website at:

- **Public Website**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login
- **Admin Dashboard**: http://localhost:3000/admin

## 📱 Social Media Integration

The website includes share buttons for:

### Korean Platforms
- **Naver**: https://share.naver.com
- **Daum**: KakaoTalk Share
- **Kakao**: KakaoTalk Share

### International Platforms
- **Facebook**: Facebook Share
- **Twitter**: Twitter/X Share
- **LinkedIn**: LinkedIn Share
- **YouTube**: YouTube Channel link

## 🛠️ Admin Panel Features

### Dashboard
- Overview statistics (users, posts, notices, media)
- Recent activity feed
- Quick links to common tasks

### Content Management
- Edit all page content
- Add new sections
- Reorder content
- Toggle active/inactive status

### Notice Management
- Create, edit, delete notices
- Pin important notices
- Categorize notices
- Track views

### Post Management
- Moderate all posts
- Edit or delete posts
- View post statistics
- Manage comments

### Media Management
- Upload images and videos
- Organize media by category
- Add captions and descriptions
- Delete unwanted media

### User Management
- View all registered members
- Edit user profiles
- Change user roles
- Delete users (except admin)

## 🔄 Development

### Adding New Routes
1. Create route file in `server/routes/`
2. Create controller functions
3. Add route to `server/index.js`

### Modifying Styles
- Edit `public/css/styles.css`
- Uses CSS variables for easy theming
- Already mobile-responsive

### Adding Features
- Follow existing patterns in routes and models
- Use existing middleware for authentication
- Maintain consistent code style

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `PUT /api/auth/password` - Change password

### Content
- `GET /api/content/page/:page` - Get page content
- `GET /api/content` - Get all content (admin)
- `POST /api/content` - Create content (admin)
- `PUT /api/content/:id` - Update content (admin)
- `DELETE /api/content/:id` - Delete content (admin)

### Notices
- `GET /api/notices` - Get all notices
- `GET /api/notices/:id` - Get single notice
- `POST /api/notices` - Create notice (admin)
- `PUT /api/notices/:id` - Update notice (admin)
- `DELETE /api/notices/:id` - Delete notice (admin)

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post (author/admin)
- `DELETE /api/posts/:id` - Delete post (author/admin)
- `POST /api/posts/:id/comments` - Add comment
- `POST /api/posts/:id/like` - Like/unlike post

### Media
- `GET /api/media` - Get all media
- `GET /api/media/:id` - Get single media
- `POST /api/media` - Create media (admin)
- `PUT /api/media/:id` - Update media (admin)
- `DELETE /api/media/:id` - Delete media (admin)

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

## 🔒 Security Features

- Password hashing with bcrypt
- JWT authentication
- Session management
- Protected admin routes
- CORS configuration
- Helmet.js for security headers
- Input validation

## 📱 Responsive Design

The website is fully responsive and works on:
- Desktop (1200px+)
- Laptop (992px - 1199px)
- Tablet (768px - 991px)
- Mobile (< 768px)

## 🚢 Deployment

### Deploy to VPS/Cloud

1. Set up a VPS (e.g., AWS, DigitalOcean, Heroku)
2. Install Node.js and MongoDB
3. Clone the repository
4. Install dependencies
5. Configure environment variables
6. Run initialization script
7. Start server with PM2:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name "mzchurch"
   pm2 startup
   pm2 save
   ```

### Using Docker (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server/index.js"]
```

### Using Process Managers
- PM2: For production Node.js applications
- Forever: Simple process manager
- Systemd: Native Linux process manager

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify MongoDB credentials

### Port Already in Use
- Change PORT in `.env` file
- Kill process using port 3000

### Session Issues
- Clear browser cookies
- Restart server
- Check SESSION_SECRET in `.env`

## 📞 Support

For issues or questions:
- Email: st805@naver.com
- Admin: 정중호

## 📄 License

This project is proprietary software for Mount Zion Church & Empire.

## 🙏 Credits

Developed for 시온산교회 시온산제국 (Mount Zion Church & Empire)

---

**시온산교회 시온산제국 | Mount Zion Church & Empire**

하나님의 말씀을 전파하고, 그리스도의 사랑을 실천합니다.
Spreading God's word and practicing Christ's love.