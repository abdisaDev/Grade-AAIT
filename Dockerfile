FROM zenika/alpine-chrome:83-with-node-22

USER root
ENV NODE_ENV=production
WORKDIR /src

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 8080
CMD ["node" , "dist/.js"]