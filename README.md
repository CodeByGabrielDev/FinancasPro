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
- RNF02 — Banco de dados em nuvem: Firebase Firestore (NoSQL)
- RNF03 — Banco local no mobile com expo-sqlite (suporte offline)
- RNF04 — App mobile em React Native com Expo
- RNF05 — Navegação com React Navigation (Stack + Bottom Tabs)
- RNF06 — Mensageria com RabbitMQ via amqplib
- RNF07 — Senhas armazenadas com bcrypt
- RNF08 — Tokens JWT com expiração de 24h
- RNF09 — Testes com Jest + supertest (backend) cobrindo os principais fluxos

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
│  Node.js + Express + Firebase Admin SDK                     │
│  • Auth: POST /auth/register, POST /auth/login              │
│  • Transações: CRUD /transactions (JWT protegido)           │
│  • Persiste dados no Firebase Firestore (nuvem)             │
│  • Publica mensagens no RabbitMQ ao criar transação         │
└──────────┬────────────────────────┬────────────────────────-┘
           │ AMQP (RabbitMQ)        │ HTTPS (Firebase Admin SDK)
           ▼                        ▼
┌──────────────────────┐  ┌────────────────────────────────────┐
│  SERVIÇO DE          │  │  Firebase Firestore (nuvem)        │
│  NOTIFICAÇÕES        │  │  • Coleção: users                  │
│  (porta 3001)        │  │  • Coleção: transactions           │
│  Node.js + amqplib   │  └────────────────────────────────────┘
│  • Consome fila      │
│  • Gera alertas      │
│  • Persiste em JSON  │
└──────────────────────┘
           ▲
┌──────────────────────┐
│  RabbitMQ            │
│  (porta 5672/15672)  │
│  Docker container    │
└──────────────────────┘
```

### Justificativa das Tecnologias

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Mobile | React Native + Expo | Desenvolvimento cross-platform rápido |
| Local DB | expo-sqlite | Suporte nativo offline-first no Expo |
| Navegação | React Navigation | Padrão da comunidade React Native |
| Backend | Node.js + Express | Leve, assíncrono, mesma stack dos projetos base |
| Banco de dados | Firebase Firestore | Banco NoSQL em nuvem, sem necessidade de servidor dedicado |
| Auth | JWT + bcrypt | Padrão de mercado para APIs REST stateless |
| Mensageria | RabbitMQ + amqplib | Comunicação assíncrona e desacoplada entre serviços |
| Testes | Jest + supertest | Padrão Node.js para testes de integração de API |

---

## 3. Conceito de Sistema Distribuído Aplicado

**Modo Offline + Sincronização + Mensageria**

- **Modo Offline (offline-first):** O app salva transações no SQLite local com flag `sincronizado = 0`. Ao detectar conexão via NetInfo, sincroniza automaticamente com a API.
- **Mensageria assíncrona:** Cada transação criada na API publica uma mensagem na fila `nova_transacao` do RabbitMQ. O serviço de notificações consome essa fila e gera alertas em tempo real, armazenados em arquivo JSON para persistência entre reinicializações.

Esses dois conceitos juntos demonstram **resiliência** (offline-first) e **desacoplamento** (mensageria assíncrona), pilares de sistemas distribuídos modernos.

---

## 4. Estrutura de Pastas

```
ProjetoFinalMoveisEDistribuidos/
├── README.md
├── docker-compose.yml          ← RabbitMQ
├── .env.example                ← Template de variáveis de ambiente
├── backend/                    ← API Principal (porta 3000)
│   ├── package.json
│   ├── serviceAccountKey.json  ← Credenciais Firebase (NÃO commitar)
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   └── firebase.js     ← Firebase Admin SDK
│       ├── middlewares/
│       │   └── auth.js         ← Middleware JWT
│       ├── controllers/
│       │   ├── authController.js
│       │   └── transactionController.js
│       ├── routes/
│       │   ├── auth.js
│       │   └── transactions.js
│       └── services/
│           └── rabbitmqService.js
├── notification-service/        ← Serviço de Notificações (porta 3001)
│   ├── package.json
│   ├── notifications.json       ← Notificações persistidas (gerado automaticamente)
│   └── src/
│       └── index.js
├── frontend/                    ← Interface Web React (porta 5173)
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/
│       └── services/
└── mobile/                      ← App React Native (Expo)
    ├── App.js
    ├── navigation/
    └── src/
        ├── database/db.js       ← SQLite local (offline)
        ├── services/
        │   ├── api.js
        │   └── sync.js          ← Sincronização offline
        ├── context/
        └── screens/
```

---

## 5. Como Executar

### Pré-requisitos
- Node.js 18+
- Docker Desktop
- Expo Go no celular (ou emulador Android/iOS)
- Arquivo `serviceAccountKey.json` do Firebase em `backend/`

> Para obter o `serviceAccountKey.json`: Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada

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

### Passo 4 — Frontend Web (opcional)
```bash
cd frontend
npm install
npm run dev
```
Acesse: **http://localhost:5173**

### Passo 5 — App Mobile
```bash
cd mobile
npm install
npx expo start
```
Escaneie o QR code com o Expo Go ou pressione `a` para Android / `i` para iOS.

> ⚠️ **IP da API no mobile:** Edite `mobile/src/services/api.js` e ajuste `API_BASE_URL` para o IP local da sua máquina (ex: `http://192.168.1.x:3000`). Para emulador Android use `http://10.0.2.2:3000`.

### Passo 6 — Testes automatizados
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
| GET | /notifications | Listar todas as notificações |
| GET | /notifications/alerts | Listar somente os alertas |
| DELETE | /notifications | Limpar todas as notificações |
| GET | /health | Health check do serviço |
