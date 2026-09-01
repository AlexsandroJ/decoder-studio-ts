FROM node:22

WORKDIR /usr/src/api

RUN git clone https://github.com/AlexsandroJ/decoder-studio-ts.git  . \
    && npm install

EXPOSE 3001

CMD ["npm", "start"]