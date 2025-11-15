FROM node:18-alpine AS base
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy server code
COPY server ./server

# Expose port
ENV PORT=5000
ENV CLIENT_URL=

# Start demo API (in-memory) for quick deploy
CMD ["node", "server/demo.js"]

