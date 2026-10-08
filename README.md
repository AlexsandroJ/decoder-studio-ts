# 🚗📡 Decoder Studio TS

> API unificada de alta performance para ingestão, decodificação em tempo real e fusão (merge) de dados de redes **CAN Bus** e sensores genéricos.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![MQTT](https://img.shields.io/badge/MQTT-660066?style=for-the-badge&logo=mqtt&logoColor=white)](https://mqtt.org/)
[![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](#-licença)

---

## 📑 Sumário

- [Sobre o projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#️-arquitetura)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e execução](#-instalação-e-execução)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Scripts disponíveis](#-scripts-disponíveis)
- [Simuladores](#-simuladores)
- [Testes](#-testes)
- [Observabilidade](#-observabilidade)
- [Docker e Kubernetes](#-docker-e-kubernetes)
- [CI/CD](#-cicd)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 📖 Sobre o projeto

O **Decoder Studio TS** resolve um desafio comum em telemetria veicular e industrial: receber dados brutos em **hexadecimal**, aplicar regras de decodificação (no estilo de arquivos `.dbc` simplificados) e unificá-los com leituras de sensores genéricos em uma estrutura de dados coesa e consultável.

O sistema segue uma arquitetura em camadas (Controllers, Services, Models), garantindo responsabilidade única, facilidade de manutenção e boa cobertura de testes unitários.

## ✨ Funcionalidades

- **Ingestão híbrida:** recebe frames CAN brutos via **HTTP** ou **MQTT**, além de dados de sensores genéricos.
- **Decodificação bitwise:** motor de decodificação nativo em TypeScript que extrai sinais com base em `startBit`, `bitLength`, `byteOrder` (Intel/Motorola), `factor` e `offset`.
- **Unificação de dados:** converte automaticamente dados brutos em registros unificados (`IUnifiedRecord`), prontos para dashboards e análises.
- **Merge temporal:** algoritmo que agrupa sinais CAN e leituras de sensores ocorridos dentro de uma mesma janela de tempo (ex.: 500 ms), criando um *snapshot* completo do estado do sistema.
- **Observabilidade:** instrumentação com OpenTelemetry e métricas no formato Prometheus.
- **Testes robustos:** suíte com Jest, Supertest e MongoDB em memória, validando a lógica de negócio sem depender de um banco real.
- **Pronto para deploy:** Dockerfile e manifestos Kubernetes inclusos.

## 🏛️ Arquitetura

```
 ┌──────────────┐   HTTP    ┌──────────────┐
 │  Frames CAN  │ ────────► │              │
 │  (hex bruto) │   MQTT    │  Controllers │
 └──────────────┘ ────────► │              │
                            └──────┬───────┘
 ┌──────────────┐                  │
 │   Sensores   │ ────────────────►│
 │  genéricos   │                  ▼
 └──────────────┘          ┌──────────────┐
                           │   Services   │  decodificação bitwise
                           │              │  unificação + merge temporal
                           └──────┬───────┘
                                  ▼
                           ┌──────────────┐
                           │    Models    │  persistência (MongoDB)
                           └──────────────┘
```

## 📂 Estrutura do projeto

```
decoder-studio-ts/
├── .github/workflows/    # Pipelines de CI/CD
├── __tests__/            # Suíte de testes unitários (Jest)
├── src/
│   ├── controllers/      # Handlers HTTP (validação e orquestração)
│   ├── models/           # Schemas e acesso ao banco de dados
│   ├── services/         # Lógica de negócio (ex.: CanDecoderService)
│   ├── types/            # Interfaces TypeScript (ICanFrame, IUnifiedRecord, ...)
│   ├── mqtt/             # Cliente e processadores de mensagens MQTT
│   ├── public/           # Arquivos estáticos (copiados para dist/ no build)
│   └── server.ts         # Ponto de entrada da aplicação
├── Dockerfile            # Imagem Docker da API
├── deployment.yaml       # Manifesto Kubernetes
├── deployment-all.yaml   # Manifesto Kubernetes (stack completa)
├── simulation-api.js     # Simulador de envio de dados via HTTP
├── simulation-mqtt.js    # Simulador de envio de dados via MQTT
├── jest.config.js        # Configuração do Jest
├── tsconfig.json         # Configuração do TypeScript
└── package.json          # Dependências e scripts
```

## 🧰 Pré-requisitos

- [Node.js](https://nodejs.org/) **22** ou superior
- [npm](https://www.npmjs.com/)
- Uma instância de [MongoDB](https://www.mongodb.com/) acessível
- (Opcional) Um broker MQTT, como o [Mosquitto](https://mosquitto.org/)
- (Opcional) [Docker](https://www.docker.com/) para execução em contêiner

## 🚀 Instalação e execução

```bash
# 1. Clone o repositório
git clone https://github.com/AlexsandroJ/decoder-studio-ts.git
cd decoder-studio-ts

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env .env.local   # ajuste conforme a seção abaixo

# 4a. Modo desenvolvimento (hot reload)
npm run dev

# 4b. Ou gere o build e execute em produção
npm run build
npm start
```

Por padrão a API é exposta na porta **3001** (a mesma porta usada no `Dockerfile`).

## 🔐 Variáveis de ambiente

A configuração é feita por meio de um arquivo `.env` na raiz do projeto. Exemplo ilustrativo — ajuste os nomes e valores conforme o seu ambiente:

```env
# Porta HTTP da API
PORT=3001

# Conexão com o MongoDB
MONGO_URI=mongodb://localhost:27017/decoder-studio

# Broker MQTT
MQTT_URL=mqtt://localhost:1883
```

> ⚠️ **Nunca versione credenciais.** Mantenha o `.env` fora do controle de versão (ele já está listado no `.gitignore`).

## 📜 Scripts disponíveis

| Script                  | Descrição                                          |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Inicia a API em modo watch com `tsx`               |
| `npm run build`         | Compila o TypeScript e copia `src/public` p/ `dist` |
| `npm start`             | Executa a versão compilada (`dist/server.js`)      |
| `npm run clean`         | Remove a pasta `dist`                              |
| `npm run typecheck`     | Verifica os tipos sem gerar arquivos               |
| `npm test`              | Executa a suíte de testes                          |
| `npm run test:watch`    | Executa os testes em modo watch                    |
| `npm run test:coverage` | Executa os testes com relatório de cobertura       |

## 🧪 Simuladores

O repositório inclui scripts para gerar tráfego de teste sem precisar de hardware real:

```bash
# Envia dados simulados para a API via HTTP
node simulation-api.js

# Publica dados simulados em um broker MQTT
node simulation-mqtt.js
```

## ✅ Testes

Os testes usam **Jest** com **ts-jest**, **Supertest** para a camada HTTP e **mongodb-memory-server**, que sobe um MongoDB em memória — assim a suíte roda de forma isolada, sem depender de um banco externo.

```bash
npm test               # execução única
npm run test:watch     # modo watch
npm run test:coverage  # cobertura de código
```

## 📊 Observabilidade

O projeto utiliza **OpenTelemetry** (instrumentação automática para Node.js) e **prom-client** com exporter **Prometheus**, permitindo coletar métricas da aplicação e integrá-las a ferramentas como Prometheus e Grafana.

## 🐳 Docker e Kubernetes

### Docker

```bash
# Build da imagem
docker build -t decoder-studio-ts .

# Execução
docker run -d --name decoder-studio -p 3001:3001 --env-file .env decoder-studio-ts
```

> O `Dockerfile` atual clona o repositório a partir do GitHub durante o build, instala as dependências e gera a pasta `dist/`.

### Kubernetes

Os manifestos `deployment.yaml` e `deployment-all.yaml` estão disponíveis na raiz do projeto:

```bash
kubectl apply -f deployment.yaml
# ou, para a stack completa:
kubectl apply -f deployment-all.yaml
```

## 🔄 CI/CD

Os workflows do GitHub Actions ficam em [`.github/workflows`](.github/workflows).

## 🤝 Contribuindo

Contribuições são bem-vindas!

1. Faça um *fork* do projeto
2. Crie uma branch para a sua feature: `git checkout -b feature/minha-feature`
3. Faça o commit das alterações: `git commit -m "feat: adiciona minha feature"`
4. Envie para o seu fork: `git push origin feature/minha-feature`
5. Abra um **Pull Request**

Antes de abrir o PR, garanta que `npm run typecheck` e `npm test` passam sem erros.

## 📄 Licença

Distribuído sob a licença **MIT**.

---

<p align="center">Feito com ☕ e TypeScript por <a href="https://github.com/AlexsandroJ">AlexsandroJ</a></p>
