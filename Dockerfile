# Usamos una imagen oficial de Node.js ligera
FROM node:18-alpine

# Creamos y nos movemos al directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de package desde la carpeta backend-node
COPY backend-node/package*.json ./

# Instalamos las dependencias de producción
RUN npm install --production

# Copiamos el server.js desde backend-node y la carpeta public
COPY backend-node/server.js ./
COPY public/ ./public/

# Exponemos el puerto donde corre Express
EXPOSE 3001

# Comando para arrancar la aplicación
CMD ["npm", "start"]