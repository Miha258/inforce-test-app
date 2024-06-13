FROM node:latest

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install
RUN npm install -g prisma

COPY . .
RUN npx prisma migrate dev --name init
RUN npx prisma generate


EXPOSE 3000
CMD ["node", "index.js"]
