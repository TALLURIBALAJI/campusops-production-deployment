# ==========================================================
# CampusOps Nginx Reverse Proxy Dockerfile
# Production ingress controller routing to frontend and backend
# ==========================================================

FROM nginx:alpine

# Remove default configuration and copy custom reverse proxy setup
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
