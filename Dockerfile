# Single-stage or robust multi-stage Docker build
FROM node:22-alpine

WORKDIR /app

# Copy everything from repository
COPY . .

# Install dependencies and build frontend
RUN npm install
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/index.js"]
