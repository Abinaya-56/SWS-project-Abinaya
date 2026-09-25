FROM node:20-alpine AS build

WORKDIR /app
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/config.js.template /etc/nginx/config.js.template
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint-custom.sh
RUN chmod +x /usr/local/bin/docker-entrypoint-custom.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint-custom.sh"]
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80
