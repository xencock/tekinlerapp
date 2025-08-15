FROM nginx:alpine

# Install additional tools
RUN apk add --no-cache \
    curl \
    vim \
    htop

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create custom error pages
RUN mkdir -p /usr/share/nginx/html

# Create custom 404 page with proper UTF-8 encoding
RUN echo '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>404 - Sayfa Bulunamadı</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#f5f5f5;}h1{color:#333;}.error{background:white;padding:30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}</style></head><body><div class="error"><h1>404</h1><h2>Sayfa Bulunamadı</h2><p>Aradığınız sayfa mevcut değil.</p><a href="/">Ana Sayfaya Dön</a></div></body></html>' > /usr/share/nginx/html/404.html

# Create custom 50x page with proper UTF-8 encoding
RUN echo '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>500 - Sunucu Hatası</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#f5f5f5;}h1{color:#d32f2f;}.error{background:white;padding:30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}</style></head><body><div class="error"><h1>500</h1><h2>Sunucu Hatası</h2><p>Bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p><a href="/">Ana Sayfaya Dön</a></div></body></html>' > /usr/share/nginx/html/50x.html

# Create health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost/health || exit 1' > /usr/local/bin/healthcheck.sh && \
    chmod +x /usr/local/bin/healthcheck.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
