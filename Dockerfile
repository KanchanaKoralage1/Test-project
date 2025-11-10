FROM node:18-alpine AS base

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

# Install production dependencies
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci && npm cache clean --force
COPY . .
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app

# Add healthcheck for development
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res)=>{process.exit(res.statusCode === 200 ? 0 : 1)}).on('error',()=>{process.exit(1)})"

USER nodejs
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app

# Add healthcheck for production
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res)=>{process.exit(res.statusCode === 200 ? 0 : 1)}).on('error',()=>{process.exit(1)})"

USER nodejs
EXPOSE 3000
CMD ["npm", "start"]