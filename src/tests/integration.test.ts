import Fastify, { FastifyInstance } from 'fastify';
import { orderRoutes } from '../api/orders';
import fastifyWebsocket from '@fastify/websocket';

// Mock Prisma
jest.mock('../db/prisma', () => ({
    __esModule: true,
    default: {
        userOrder: {
            create: jest.fn().mockResolvedValue({ id: 'mock-order-id', status: 'pending' }),
        },
    },
}));

// Mock Queue
jest.mock('../queue/orderQueue', () => ({
    addOrderToQueue: jest.fn(),
}));

describe('API Integration', () => {
    let server: FastifyInstance;

    beforeAll(async () => {
        server = Fastify();
        await server.register(fastifyWebsocket); // Register WS plugin first
        await server.register(orderRoutes);
    });

    afterAll(async () => {
        await server.close();
    });

    it('POST /orders/execute should create order and return orderId', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/orders/execute',
            payload: {
                inputToken: 'SOL',
                outputToken: 'USDC',
                amount: 10,
            },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
        expect(body.orderId).toBe('mock-order-id');
    });

    it('POST /orders/execute should validate input', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/orders/execute',
            payload: {
                inputToken: 'SOL',
                // Missing outputToken
                amount: -5, // Invalid amount
            },
        });

        expect(response.statusCode).toBe(400);
    });
});
