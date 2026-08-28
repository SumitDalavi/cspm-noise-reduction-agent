FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
# We use ts-node to run directly in dev, but for prod we could compile
# For simplicity in this microservice:
EXPOSE 3000

CMD ["npm", "start"]
