FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=5000
ENV DATA_DIR=/app/data

RUN mkdir -p /app/data

VOLUME ["/app/data"]
EXPOSE 5000

CMD ["npm", "start"]
