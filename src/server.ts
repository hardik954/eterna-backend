import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { orderRoutes } from './api/orders';
import { websocketRoutes } from './ws/websocketHandler';
import { orderWorker } from './queue/orderWorker';

const server = Fastify({
    logger: {
        level: 'error'
    }
});

server.register(fastifyWebsocket);

server.get('/health', async () => {
    return { status: 'ok' };
});
server.register(orderRoutes, { prefix: '/api' });
server.register(websocketRoutes);

const start = async () => {
    try {
        await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server running on http://localhost:3000');

        console.log('Order Worker started with concurrency:', orderWorker.opts.concurrency);

    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
