Order Execution Engine – Design Decisions

This project implements a MOCK Solana-based Order Execution Engine that processes a single order type with DEX routing and real-time WebSocket updates. It demonstrates how an actual trading backend handles order intake, routing, execution, and confirmation.

Why I Chose Market Orders

I selected Market Orders because:

They are the simplest and most commonly executed order type.

They allow a clear, linear flow from routing → transaction → confirmation.

They avoid additional conditions (like limit price checks), keeping the system focused on core execution logic.

Extending to Other Order Types

Limit Orders: Add a price watcher that triggers the same execution engine when the target price is reached.

Sniper Orders: Add a listener that detects token launch/migration events before triggering execution.

The core routing and transaction logic stays the same for all order types.

 Architecture Overview

1. Order Submission (HTTP → WebSocket Upgrade)

User sends POST /api/orders/execute.

Server validates the request and generates an orderId.

The same connection upgrades to a WebSocket.

Connect to websocket through the orderId to see the status of the order

The server streams live order statuses:

pending → routing → building → submitted → confirmed/failed.

2. DEX Routing

The engine fetches quotes from Raydium and Meteora, then:

Compares expected output amounts and liquidity.

Selects the DEX with the better execution price.

Logs routing decisions for transparency.

3. Transaction Building

Once a DEX is selected:

The system builds the transaction

Handles WSOL wrapping/unwrapping when needed.

Applies slippage protection.

Prepares swap instructions for the chosen DEX.

4. Submission & Confirmation

The transaction is submitted to Solana (or simulated).

The engine waits for confirmation.

Uses exponential backoff (max 3 retries) on network errors.

Emits either:

"confirmed" with final amounts and txHash,

or "failed" with error details.

5. Concurrency Control

The system processes up to 10 orders concurrently.

Remaining orders stay in "pending" until workers become available.

This models realistic backend throughput (approx. 100 orders/min).

6. Implementation of Mock Mode 

Simulated price differences between Raydium and Meteora (2–5%).

Simulated delays (2–3 seconds).

Fake transaction hashes.

Great for demonstrating architecture without RPC dependencies.

7. End-to-End Flow Summary

Once the engine is running, a user can:

Submit an order through one HTTP endpoint.

Receive all status updates via WebSocket.

Have the system automatically choose the best DEX.

Watch the transaction build, submit, retry, and confirm in real-time.

Get the final "confirmed" or "failed" status with details.

This provides a clear, production-style demonstration of a real-world order execution pipeline.