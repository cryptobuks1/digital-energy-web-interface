FROM node:lts
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
COPY sample_config.json ./
USER node
RUN npm install
RUN npm install --save digital-energy-ipfs-edge
RUN npm ci
COPY --chown=node:node . .
EXPOSE 3000
CMD ["node", "./standalone.js","/digital-energy-docker"]
