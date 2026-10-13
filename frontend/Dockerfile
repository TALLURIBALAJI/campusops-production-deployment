# ==========================================================
# CampusOps Frontend Dockerfile (React + Vite + TypeScript)
# Multi-stage production build with Nginx static server
# ==========================================================

# ----------------------------------------------------------
# Stage 1: Build the React Application
# ----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Clean installation of dependencies
RUN npm ci

# Copy project files
COPY . .

# Set VITE_API_BASE_URL to empty so all API requests use relative paths behind Nginx
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build static bundle with TypeScript check and Vite
RUN npm run build

# ----------------------------------------------------------
# Stage 2: Production Nginx Server
# ----------------------------------------------------------
FROM nginx:alpine

# Copy custom Nginx configuration for client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production build assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
