# Etapa 1: Construcción (Build)
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor (Production)
FROM nginx:alpine
# Copia los archivos construidos desde la etapa anterior a la carpeta de Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Copia una config básica de Nginx (necesario para que React Router funcione al recargar)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]