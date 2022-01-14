FROM node:12.22.8-alpine3.14
RUN apk add wget tar
RUN wget https://download.docker.com/linux/static/stable/x86_64/docker-18.06.3-ce.tgz
RUN tar zxvf docker-18.06.3-ce.tgz
RUN mv docker/* /usr/local/bin/
RUN mkdir /app
ADD *.js /app/
ADD *.json /app/
WORKDIR /app
RUN npm install
CMD ["npm", "start"]
