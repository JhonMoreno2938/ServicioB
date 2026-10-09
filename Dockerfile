# Usamos una imagen oficial de Node.js ligera
FROM node:18-alpine

# Creamos y nos movemos al directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero los archivos de dependencias para aprovechar la caché de Docker
COPY package*.json ./

# Instalamos las dependencias de producción
RUN npm install --production

# Copiamos el resto del código del proyecto (incluyendo la carpeta public y server.js)
COPY . .

# Exponemos el puerto donde corre Express
EXPOSE 3001

# Comando para arrancar la aplicación
CMD ["npm", "start"]