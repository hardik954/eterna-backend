# Solana DEX Routing Backend

A backend system for a Solana DEX routing and order execution engine, built with Node.js, Fastify, BullMQ, Redis, and PostgreSQL.

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
    ```bash
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
    ```bash
    docker-compose up -d
    ```

5.  **Run Migrations**:
    ```bash
    npx prisma migrate dev --name init
    ```

6.  **Start Server**:
    ```bash
    npm run dev
    ```

## API Usage

### Execute Order

**Endpoint**: `POST /api/orders/execute`

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
  "orderId": "uuid-string",
  "message": "Order queued. Connect to WebSocket for updates."
}
```

### WebSocket Stream

**URL**: `ws://localhost:3000/ws/orders/:orderId`

**Messages**:
```json
{ "status": "routing" }
{ "status": "building" }
{ "status": "submitted" }
{ "status": "confirmed", "txHash": "...", "price": 102.5, "dex": "Raydium" }
```

## Design Decisions

-   **Market Order**: Chosen as the primary order type for simplicity and speed. The system focuses on finding the best current price and executing immediately.
-   **Extensibility**:
    -   **Limit Orders**: Can be implemented by adding a price check in the worker or a separate scheduled job that checks prices periodically before adding to the execution queue.
    -   **Sniper Orders**: Would require monitoring mempool or new pool events, which can be added as a separate service that triggers the execution queue when conditions are met.

## Architecture

1.  **API Layer**: Receives requests, validates input, creates DB record, and pushes to Queue.
2.  **Queue Layer**: BullMQ handles async processing, retries, and concurrency control.
3.  **Worker Layer**: Processes orders, calls the Router, and updates DB/WebSocket.
4.  **Router Layer**: Simulates DEX interactions.
5.  **WebSocket Layer**: Streams updates to the client.
