# Bible Glocal — Production Dockerfile
FROM node:20-slim

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (layer caching)
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --production

# Copy application code
COPY server.js ./
COPY public/ ./public/
COPY .env.example ./.env.example

# Create data directories
RUN mkdir -p data uploads public/uploads

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]