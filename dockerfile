FROM node:18.1.0

RUN mkdir /app
WORKDIR /app
COPY package*.json /app
RUN npm ci --only=production
COPY . /app
CMD ["npm", "start"]