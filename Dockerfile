# Node.js 18 Alpine image kullan
FROM node:18-alpine

# Çalışma dizinini belirle
WORKDIR /app

# Package.json ve package-lock.json kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install --production

# Uygulama kodlarını kopyala
COPY . .

# Port 5000'i aç
EXPOSE 5000

# Uygulamayı başlat
CMD ["npm", "start"]

