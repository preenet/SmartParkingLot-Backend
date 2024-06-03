
FROM node:18

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY index.js ./

COPY smart-parking-21e9b-firebase-adminsdk-cmymm-d701fc4c06.json ./  

EXPOSE 8000

CMD ["node", "index.js"]