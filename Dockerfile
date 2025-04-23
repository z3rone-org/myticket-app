FROM nginx:alpine

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy your HTML files into the nginx public directory
COPY www/ /usr/share/nginx/html/

# Expose port 80 (default NGINX port)
EXPOSE 80

# Start nginx in foreground
CMD ["sh", "-c", "nginx -g 'daemon off;' > /dev/null 2>&1"]
