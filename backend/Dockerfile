# Use official lightweight Node.js 20 Alpine as base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package manifests first for optimal layer caching
COPY package*.json ./

# Install dependencies (including devDependencies needed for tsc build)
RUN npm install

# Copy application source code
COPY . .

# Compile TypeScript into JavaScript (dist folder)
RUN npm run build

# Ensure SQL schema and migration files are copied into dist/db
RUN mkdir -p dist/db && cp -r src/db/*.sql dist/db/ 2>/dev/null || true

# Expose application port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Define container startup command
CMD ["npm", "start"]
