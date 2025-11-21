# Solana DEX Routing Backend

A backend system for a Solana DEX routing and order execution engine (MOCK), built with Node.js, Fastify, BullMQ, Redis, and PostgreSQL.

## Features

- **Market Order Execution**: Supports immediate execution with best-price routing.
- **Mock DEX Router**: Simulates quotes from Raydium and Meteora with price variations and delays.
- **Queue System**: Uses BullMQ for handling orders with a max concurrency of 10 and rate limiting.
- **WebSocket Streaming**: Real-time order status updates (pending, routing, building, submitted, confirmed, failed).
- **Data Persistence**: Stores all orders and execution logs in PostgreSQL.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Server**: Fastify + @fastify/websocket
- **Queue**: BullMQ + Redis
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod
- **Testing**: Jest

## Setup

1.  **Prerequisites**:
    - Node.js (v16+)
    - Docker & Docker Compose

2.  **Installation**:
    ```
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file:
    ```env
    PORT=3000
    REDIS_HOST=localhost
    REDIS_PORT=6379
    DATABASE_URL="postgresql://user:password@localhost:5432/dex_routing?schema=public"
    ```

4.  **Start Infrastructure**:
    ```
    docker-compose up -d
    ```

5.  **Run Migrations**:
    ```
    npx prisma migrate dev --name init
    ```

6.  **Start Server**:
    ```
    npm run dev
    ```

## API Usage

### Execute Order

**Endpoint**: `POST http://localhost:3000/api/orders/execute`

**Body**:
```json
{
  "inputToken": "SOL",
  "outputToken": "USDC",
  "amount": 10
}
```

**Response**:
```json
{
  "success": true,
  "orderId": "uiqueorderId-string",
  "message": "Order queued. Connect to WebSocket for updates."
}
```

### WebSocket Stream

**URL**: `ws://localhost:3000/ws/orders/<orderId>`

**Messages**:
```json
{ "status": "routing" }
{ "status": "building" }
{ "status": "submitted" }
{ "status": "confirmed", "txHash": "...", "price": 102.5, "dex": "Raydium" }
```



## Architecture

1.  **API Layer**: Receives requests, validates input, creates DB record, and pushes to Queue.
2.  **Queue Layer**: BullMQ handles async processing, retries, and concurrency control.
3.  **Worker Layer**: Processes orders, calls the Router, and updates DB/WebSocket.
4.  **Router Layer**: Simulates DEX interactions.
5.  **WebSocket Layer**: Streams updates to the client.

