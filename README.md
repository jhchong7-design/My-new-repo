# Bible Glocal — Public Static Site

**정중호 교수의 성경 사랑방 | Professor Jung Joong-Ho's Bible Study**

Public-facing website with:
- ✅ User registration and login
- ✅ 20 bilingual pages (Korean + English)
- ✅ SQLite database with auto-seeding
- ✅ Security headers, 404 page, favicon
- ✅ Social media integration

## Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Deploy Steps:
1. Create a [Render account](https://dashboard.render.com/register)
2. Click **New** → **Web Service**
3. Connect your GitHub/GitLab repo (push this code first)
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
5. Add environment variable: `JWT_SECRET` = (any random string)
6. Click **Deploy**

### Test Login
- Email: `st805@naver.com`
- Password: `#9725`