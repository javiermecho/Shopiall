FROM node:18-bullseye as bot
WORKDIR /app
COPY package*.json ./
RUN npm i
RUN npm run build
COPY . .
CMD ["npm", "start"]