FROM node:18-alpine
WORKDIR /app
COPY backend-node/package*.json ./
RUN npm install --production
COPY backend-node/ ./
EXPOSE 3001
CMD ["npm", "start"]