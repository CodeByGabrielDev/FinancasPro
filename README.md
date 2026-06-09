# 💰 FinançasPro — Sistema de Gestão Financeira Pessoal

## Visão Geral

Sistema mobile de gestão financeira pessoal integrado a um backend distribuído. Permite que o usuário registre receitas e despesas, visualize saldo, categorize transações e opere **offline**, sincronizando automaticamente quando a conexão for restaurada.

---

## 1. Requisitos

### Funcionais
- RF01 — Usuário pode se cadastrar e fazer login com e-mail e senha
- RF02 — Autenticação por token JWT com rotas protegidas
- RF03 — Usuário pode adicionar transações (receita ou despesa) com valor, categoria, descrição e data
- RF04 — Usuário pode listar, editar e excluir suas transações
- RF05 — App exibe saldo total, total de receitas e total de despesas
- RF06 — App funciona offline: transações criadas sem conexão são salvas localmente e sincronizadas quando a rede for restaurada
- RF07 — Notificações assíncronas via RabbitMQ: ao criar uma transação, uma mensagem é publicada na fila para processamento pelo serviço de notificações
- RF08 — Serviço de notificações consome a fila e registra alertas (ex: gasto acima de limite)

### Não Funcionais
- RNF01 — Backend RESTful em Node.js + Express
- RNF02 — Banco de dados SQLite (backend) com Sequelize ORM
- RNF03 — Banco local no mobile com expo-sqlite
- RNF04 — App mobile em React Native com Expo
- RNF05 — Navegação com React Navigation (Stack + Bottom Tabs)
- RNF06 — Mensageria com RabbitMQ via amqplib
- RNF07 — Senhas armazenadas com bcrypt
- RNF08 — Tokens JWT com expiração de 24h
- RNF09 — Testes com Jest (backend) e cobertura dos principais fluxos

---

## 2. Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     CAMADA MOBILE                           │
│  React Native (Expo) + expo-sqlite + NetInfo + Axios        │
│  • Telas: Login, Cadastro, Dashboard, Transações, Perfil    │
│  • Sincronização offline-first via expo-sqlite              │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP REST (JSON)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     API PRINCIPAL (porta 3000)              │
│  Node.js + Express + Sequelize + SQLite                     │
│  • Auth: POST /auth/register, POST /auth/login              │
│  • Transações: CRUD /transactions (JWT protegido)           │
│  • Publica mensagens no RabbitMQ ao criar transação         │
└───────────────────────┬─────────────────────────────────────┘
                        │ AMQP (RabbitMQ)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               SERVIÇO DE NOTIFICAÇÕES (porta 3001)          │
│  Node.js + Express + amqplib                                │
│  • Consome fila "nova_transacao"                            │
│  • Gera alertas se despesa > limite configurado             │
│  • GET /notifications — lista notificações                  │
└─────────────────────────────────────────────────────────────┘
                        ▲
┌─────────────────────────────────────────────────────────────┐
│                     RabbitMQ (porta 5672 / 15672)           │
│  Docker container — fila: "nova_transacao"                  │
└─────────────────────────────────────────────────────────────┘
```

### Justificativa das Tecnologias

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Mobile | React Native + Expo | Desenvolvimento cross-platform rápido, mesma base dos projetos existentes |
| Local DB | expo-sqlite | Já utilizado no projeto sincronizacaoOff, suporte nativo offline-first |
| Navegação | React Navigation | Padrão da comunidade React Native, suporte a Stack e Tabs |
| Backend | Node.js + Express | Leve, assíncrono, mesma stack dos projetos base |
| ORM | Sequelize + SQLite | Abstração de banco com suporte a migrations |
| Auth | JWT + bcrypt | Padrão de mercado para APIs REST stateless |
| Mensageria | RabbitMQ + amqplib | Já utilizado no projeto AtividadeDockerERabbitMq |
| Testes | Jest + supertest | Padrão Node.js para testes de API |

---

## 3. Conceito de Sistema Distribuído Aplicado

**Modo Offline + Sincronização + Mensageria**

- **Modo Offline (sincronizacaoOff como base):** O app salva transações no SQLite local com flag `sincronizado = 0`. Ao detectar conexão, sincroniza automaticamente com a API.
- **Mensageria (AtividadeDockerERabbitMq como base):** Cada transação criada na API publica uma mensagem na fila `nova_transacao` do RabbitMQ. O serviço de notificações consome essa fila e gera alertas em tempo real.

Esses dois conceitos juntos demonstram resiliência (offline-first) e desacoplamento (mensageria assíncrona), pilares de sistemas distribuídos modernos.

---

## 4. Estrutura de Pastas

```
ProjetoFinalMoveisEDistribuidos/
├── README.md
├── docker-compose.yml
├── backend/                    ← API Principal (porta 3000)
│   ├── package.json
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Transaction.js
│   │   ├── middlewares/
│   │   │   └── auth.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── transactionController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── transactions.js
│   │   └── services/
│   │       └── rabbitmqService.js
│   └── tests/
│       ├── auth.test.js
│       └── transactions.test.js
├── notification-service/        ← Serviço de Notificações (porta 3001)
│   ├── package.json
│   └── src/
│       └── index.js
└── mobile/                      ← App React Native (Expo)
    ├── package.json
    ├── App.js
    ├── src/
    │   ├── database/
    │   │   └── db.js
    │   ├── services/
    │   │   ├── api.js
    │   │   └── sync.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   └── screens/
    │       ├── LoginScreen.js
    │       ├── RegisterScreen.js
    │       ├── DashboardScreen.js
    │       ├── TransactionsScreen.js
    │       ├── AddTransactionScreen.js
    │       └── ProfileScreen.js
    └── navigation/
        └── AppNavigator.js
```

---

## 5. Como Executar

### Pré-requisitos
- Node.js 18+
- Docker Desktop
- Expo CLI (`npm install -g expo-cli`)
- Expo Go no celular ou emulador Android/iOS

### Passo 1 — Subir RabbitMQ
```bash
docker compose up -d
```

### Passo 2 — Backend (API Principal)
```bash
cd backend
npm install
npm start
```

### Passo 3 — Serviço de Notificações
```bash
cd notification-service
npm install
npm start
```

### Passo 4 — App Mobile
```bash
cd mobile
npm install
npx expo start
```
Escaneie o QR code com o Expo Go ou pressione `a` para Android / `i` para iOS.

> ⚠️ **IP da API:** Edite `mobile/src/services/api.js` e substitua o IP pelo IP local da sua máquina (ex: `192.168.1.x`). Use `10.0.2.2` para emulador Android.

### Passo 5 — Testes
```bash
cd backend
npm test
```

---

## 6. Endpoints da API

### Auth (público)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /auth/register | Cadastrar usuário |
| POST | /auth/login | Login, retorna JWT |

### Transações (JWT obrigatório)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /transactions | Listar transações do usuário |
| POST | /transactions | Criar transação |
| PUT | /transactions/:id | Editar transação |
| DELETE | /transactions/:id | Excluir transação |
| GET | /transactions/summary | Resumo: saldo, receitas, despesas |

### Notificações (público)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /notifications | Listar notificações geradas |
