FROM node:18-alpine

WORKDIR /usr/src/app

# Install backend deps using lockfile
COPY package*.json ./
RUN npm ci --omit=dev

# Install frontend deps using its lockfile
COPY frontend/package*.json frontend/
RUN npm --prefix frontend ci --omit=dev

# Copy the rest of the project
COPY . .

# Build frontend
RUN npm run build

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "run", "start:prod"]


