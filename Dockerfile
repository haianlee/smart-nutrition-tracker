# Multi-stage Docker build for Smart Nutrition & Weight Tracker
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and client package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy entire source
COPY . .

# Build Vite frontend to client/dist
RUN npm run build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy root package.json and install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy server code, built client assets, and default directories
COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist
RUN mkdir -p data uploads

EXPOSE 3001

CMD ["node", "server/index.js"]
