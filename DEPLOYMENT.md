# Deployment Guide - 시온산교회 시온산제국 Website

Complete deployment instructions for Mount Zion Church & Empire website.

## 📋 Prerequisites Deployment Checklist

Before deploying, ensure you have:
- ✅ Server access (VPS or cloud hosting)
- ✅ Domain name configured (mzchurch.com)
- ✅ MongoDB database access
- ✅ Node.js installed (v14 or higher)
- ✅ Git access
- ✅ SSL certificate for HTTPS

## 🚀 Deployment Options

### Option 1: VPS/Cloud Server (Recommended)

Best for: Full control, customization, and cost-effectiveness

#### Recommended Hosting Providers:
- **DigitalOcean** ($5-10/month)
- **AWS EC2** (Free tier available)
- **Google Cloud Platform** (Free tier available)
- **Linode** ($5/month)
- **Vultr** ($5/month)

#### Step-by-Step Deployment:

**1. Prepare Your Server**

```bash
# Update your server
ssh root@your-server-ip
apt update && apt upgrade -y

# Install Node.js (v18)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org

# Enable and start MongoDB
systemctl enable mongod
systemctl start mongod

# Install Nginx (as reverse proxy)
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2
```

**2. Clone the Repository**

```bash
# Create project directory
mkdir /var/www/mzchurch
cd /var/www/mzchurch

# Clone from GitHub
git clone https://github.com/jhchong7-design/My-new-repo.git .

# Install dependencies
npm install
```

**3. Configure Environment Variables**

```bash
# Copy example env file (or create new)
 nano .env
```

Add your configuration:

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/mzchurch
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
SESSION_SECRET=your-session-secret-key-change-this

# Email Configuration (if using email features)
EMAIL_HOST=smtp.naver.com
EMAIL_PORT=587
EMAIL_USER=st805@naver.com
EMAIL_PASS=your-email-password
```

**4. Initialize Database**

```bash
# Run database initialization
node server/utils/initDB.js
```

This will create:
- Admin user (정중호 / st805@naver.com / #9725)
- Initial content for all pages
- Sample notices

**5. Start Application with PM2**

```bash
# Start with PM2
pm2 start server/index.js --name "mzchurch"

# Configure PM2 to start on system boot
pm2 startup
pm2 save

# View logs
pm2 logs mzchurch

# View status
pm2 status
```

**6. Configure Nginx Reverse Proxy**

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/mzchurch
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name mzchurch.com www.mzchurch.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve static files directly
    location /uploads {
        alias /var/www/mzchurch/public/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/mzchurch /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

**7. Setup SSL with Let's Encrypt**

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain and configure SSL certificate
certbot --nginx -d mzchurch.com -d www.mzchurch.com

# Certbot will automatically configure Nginx with SSL
```

**8. Setup UFW Firewall**

```bash
# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Check status
ufw status
```

**9. Configure DNS Settings**

Go to your domain registrar (where you bought mzchurch.com) and configure:

```
Type: A Record
Name: @
Value: Your server IP address
TTL: 3600

Type: A Record
Name: www
Value: Your server IP address
TTL: 3600
```

**10. Test Your Deployment**

Visit:
- http://mzchurch.com (should redirect to HTTPS)
- https://mzchurch.com (should show the website)
- https://mzchurch.com/admin (admin panel)

### Option 2: Heroku (Easiest)

Best for: Quick deployment, automatic scaling

**1. Install Heroku CLI**

```bash
# On Ubuntu/Debian
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh
```

**2. Login to Heroku**

```bash
heroku login
```

**3. Create Heroku App**

```bash
heroku create mzchurch
```

**4. Add MongoDB**

```bash
# Create MongoDB Atlas account and get connection string
heroku config:set MONGODB_URI=mongodb+srv://your-mongodb-connection-string
```

**5. Set Environment Variables**

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
heroku config:set SESSION_SECRET=your-session-secret
```

**6. Deploy**

```bash
# Push to Heroku
git push heroku main

# Initialize database (run this in Heroku console)
heroku run node server/utils/initDB.js
```

**7. Open App**

```bash
heroku open
```

### Option 3: Docker

Best for: Containerized deployment, easy scaling

**1. Create Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server/index.js"]
```

**2. Create docker-compose.yml**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/mzchurch
    depends_on:
      - mongodb
    restart: always

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: always

volumes:
  mongodb_data:
```

**3. Build and Run**

```bash
# Build and start
docker-compose up -d

# Initialize database
docker-compose exec app node server/utils/initDB.js
```

## 📊 Monitoring & Maintenance

### Log Management

```bash
# View PM2 logs
pm2 logs mzchurch

# Rotate logs (prevent disk filling)
pm2 install pm2-logrotate
```

### Database Backups

```bash
# Create backup
mongodump --db mzchurch --out /backup/$(date +%Y%m%d)

# Schedule daily backups (cron)
0 2 * * * mongodump --db mzchurch --out /backup/$(date +\%Y\%m\%d)
```

### Update Application

```bash
cd /var/www/mzchurch

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart with PM2
pm2 restart mzchurch
```

## 🔒 Security Best Practices

1. **Keep dependencies updated**
   ```bash
   npm audit fix
   ```

2. **Use strong secrets** in environment variables

3. **Enable firewall** (UFW)

4. **Regular backups** of database

5. **Monitor logs** for suspicious activity

6. **Keep system updated**
   ```bash
   apt update && apt upgrade -y
   ```

## 📱 Post-Deployment Checklist

- [ ] Website loads correctly at mzchurch.com
- [ ] HTTPS is working with valid SSL certificate
- [ ] Admin login works with credentials
- [ ] All pages are accessible
- [ ] Social media sharing works
- [ ] User registration works
- [ ] Email notifications work (if configured)
- [ ] Database backups are scheduled
- [ ] Monitoring is set up
- [ ] SSL certificate auto-renewal is configured

## 🆘 Troubleshooting

### Common Issues:

**Port 3000 already in use?**
```bash
pm2 stop mzchurch
pm2 restart mzchurch
```

**MongoDB connection failed?**
```bash
# Check MongoDB status
systemctl status mongod

# Check MONGODB_URI in .env
cat .env | grep MONGODB_URI
```

**Nginx 502 Bad Gateway?**
```bash
# Check if app is running
pm2 status

# Check logs
pm2 logs mzchurch --lines 50
```

**Website not loading?**
```bash
# Check Nginx status
systemctl status nginx

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx
```

## 📞 Support

For deployment issues:
- Email: st805@naver.com
- Admin: 정중호
- GitHub: https://github.com/jhchong7-design/My-new-repo

## 🎉 Success!

Your Mount Zion Church & Empire website is now live!

Access points:
- **Website**: https://mzchurch.com
- **Admin Panel**: https://mzchurch.com/admin
- **Admin Login**: https://mzchurch.com/admin/login

---

시온산교회 시온산제국 | Mount Zion Church & Empire
하나님의 말씀을 전파하고, 그리스도의 사랑을 실천합니다.