# 🚗📡 Decoder Studio TS

> API unificada de alta performance para ingestão, decodificação em tempo real e fusão (merge) de dados de redes CAN Bus e sensores genéricos.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)

---

## 📖 Sobre o Projeto

O **Decoder Studio TS** foi projetado para resolver o desafio de telemetria veicular e industrial: receber dados brutos em hexadecimal, aplicar regras de decodificação (estilo arquivos `.dbc` Simplificados) e unificá-los com leituras de sensores genéricos em uma estrutura de dados coesa e consultável.

O sistema utiliza uma arquitetura em camadas (Controllers, Services, Models) garantindo responsabilidade única, facilitando a manutenção e a cobertura de testes unitários.

### ✨ Funcionalidades Principais

- **Ingestão Híbrida:** Recebe frames CAN brutos (HTTP ou MQTT) e dados de sensores genéricos.
- **Decodificação Bitwise:** Motor de decodificação nativo em TypeScript que extrai sinais com base em `startBit`, `bitLength`, `byteOrder` (Intel/Motorola), `factor` e `offset`.
- **Unificação de Dados:** Converte automaticamente dados brutos em registros unificados (`IUnifiedRecord`), prontos para dashboards e análises.
- **Merge Temporal:** Algoritmo que agrupa sinais CAN e leituras de sensores que ocorrem dentro de uma mesma janela de tempo (ex: 500ms), criando um snapshot completo do estado do sistema.
- **Testes Unitários Robustos:** Suite de testes com Jest e mocks isolados, garantindo que a lógica de negócio funcione sem depender de banco de dados real.

---

## 🏗️ Estrutura do Projeto

```text
decoder-studio-ts/
├── src/
│   ├── controllers/      # Handlers de requisição HTTP (validação e orquestração)
│   ├── models/           # Schemas do Mongoose e métodos de acesso ao banco de dados
│   ├── services/         # Lógica de negócio pura (ex: CanDecoderService)
│   ├── types/            # Definições de interfaces TypeScript (ICanFrame, IUnifiedRecord, etc.)
│   ├── mqtt/             # Cliente e processadores de mensagens MQTT
│   └── server.ts         # Ponto de entrada da aplicação
├── __tests__/            # Suíte de testes unitários com Jest
├── .env                  # Variáveis de ambiente (não versionado)
├── package.json          # Dependências e scripts
└── tsconfig.json         # Configuração do TypeScript
```