# Multi-stage build to produce an optimized production image for the Vite frontend

# 1) Build stage: install dependencies and generate the production bundle
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* bun.lockb* ./
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    elif [ -f bun.lockb ]; then \
      npm install bun && npx bun install; \
    else \
      npm install; \
    fi

# Copy the rest of the source and build
COPY . .
RUN npm run build

# 2) Runtime stage: serve the compiled assets with Nginx
FROM nginx:1.27-alpine

# Copy built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Provide a basic default Nginx config (can be replaced if you have a custom one)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
