FROM node:22

WORKDIR /usr/src/api

# Clona o repositório, instala as dependências e gera a pasta dist/
RUN git clone https://github.com/AlexsandroJ/decoder-studio-ts.git . \
    && npm install \
    && npm run build

EXPOSE 3001

CMD ["npm", "start"]