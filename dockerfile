FROM node:18.1-alpine as appbuild

WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
RUN npm run build

FROM node:18.1-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=appbuild /app/out ./out
COPY --from=appbuild /app/resources ./resources
CMD ["npm", "start"]