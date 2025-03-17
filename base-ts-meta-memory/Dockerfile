FROM node:18-bullseye as bot
WORKDIR /app
COPY base-ts-meta-memory .
COPY base-ts-meta-memory/package.json ./
RUN npm i
RUN npm run build
COPY . .
CMD ["npm", "run", "start"]