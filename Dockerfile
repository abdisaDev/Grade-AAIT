FROM ghcr.io/puppeteer/puppeteer:24.6.1

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm i

COPY . .

CMD [ "node", "dist/index.js" ]