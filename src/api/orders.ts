import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../db/prisma';
import { addOrderToQueue } from '../queue/orderQueue';

const orderSchema = z.object({
    inputToken: z.string(),
    outputToken: z.string(),
    amount: z.number().positive(),
    slippageTolerance: z.number().min(0).max(1).optional().default(0.01),
});

export async function orderRoutes(fastify: FastifyInstance) {
    fastify.post('/orders/execute', async (req, reply) => {
        try {
            const data = orderSchema.parse(req.body);

            console.log('\n' + '='.repeat(60));
            console.log(' NEW ORDER RECEIVED');
            console.log('='.repeat(60));
            console.log(`   Input:  ${data.amount} ${data.inputToken}`);
            console.log(`   Output: ${data.outputToken}`);
            console.log(`   Slippage Tolerance: ${(data.slippageTolerance * 100).toFixed(2)}%`);
            console.log('─'.repeat(60));

            const order = await prisma.userOrder.create({
                data: {
                    inputToken: data.inputToken,
                    outputToken: data.outputToken,
                    amount: data.amount,
                    status: 'pending',
                },
            });

            console.log(`   Order ID: ${order.id}`);
            console.log(`   Status: QUEUED `);
            console.log('='.repeat(60) + '\n');

            await addOrderToQueue(order.id, data);

            return reply.send({
                success: true,
                orderId: order.id,
                message: 'Order queued. Connect to WebSocket for updates.'
            });

        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: 'Validation failed', details: error.issues });
            }
            console.error(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}
