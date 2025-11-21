import { FastifyInstance, FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import prisma from '../db/prisma';

const clients = new Map<string, WebSocket>();

async function websocketRoutes(fastify: FastifyInstance) {
    fastify.get('/ws/orders/:orderId', { websocket: true },
        (socket: any, req: FastifyRequest<{ Params: { orderId: string } }>) => {

            const { orderId } = req.params;
            console.log(`Client connected for order ${orderId}`);

            clients.set(orderId, socket);

            socket.on('close', () => {
                console.log(`Client disconnected for order ${orderId}`);
                clients.delete(orderId);
            });

            socket.send(JSON.stringify({ status: 'connected', orderId }));

            (async () => {
                try {
                    console.log(`[WS] Fetching execution logs for order ${orderId}...`);
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const logs = await prisma.executionLog.findMany({
                        where: { orderId },
                        orderBy: { timestamp: 'asc' }
                    });

                    console.log(`[WS] Found ${logs.length} execution logs for order ${orderId}`);

                    for (const log of logs) {
                        const message = log.message ? JSON.parse(log.message) : {};
                        if (socket.readyState === WebSocket.OPEN) {
                            const payload = JSON.stringify({ status: log.status, ...message });
                            console.log(`[WS] Sending message: ${payload}`);
                            socket.send(payload);
                        } else {
                            console.log(`[WS] Socket not open, readyState: ${socket.readyState}`);
                        }
                    }
                    console.log(`[WS] Finished sending execution logs for order ${orderId}`);
                } catch (error) {
                    console.error('[WS] Error fetching execution logs:', error);
                }
            })();
        });
}

export { websocketRoutes };

export function broadcastStatus(orderId: string, status: string, data?: any) {
    const client = clients.get(orderId);
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ status, ...data }));
    }
}
