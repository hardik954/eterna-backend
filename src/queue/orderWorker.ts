import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import prisma from '../db/prisma';
import { dexRouter } from '../router/dexRouter';
import { broadcastStatus } from '../ws/websocketHandler';

const redisConnection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});

export const orderWorker = new Worker(
    'order-queue',
    async (job: Job) => {
        const { orderId, inputToken, outputToken, amount, slippageTolerance = 0.01 } = job.data;

        try {
            await updateStatus(orderId, 'pending', { message: 'Order received and queued.' });
            console.log(`[Worker] Processing order ${orderId} (Attempt ${job.attemptsMade + 1})`);

            if (job.attemptsMade > 0) {
                const backoffDelay = Math.min(1000 * Math.pow(2, job.attemptsMade - 1), 10000);
                console.log(`[Worker] Retry backoff: ${backoffDelay}ms`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }

            await updateStatus(orderId, 'routing', { message: 'System is fetching quotes from Raydium and Meteora.' });
            const quote = await dexRouter.getQuote(inputToken, outputToken, amount, slippageTolerance);

            await updateStatus(orderId, 'building', {
                message: 'System is building the transaction and applying slippage.',
                raydiumQuote: quote.raydiumPrice.toFixed(4),
                meteoraQuote: quote.meteoraPrice.toFixed(4),
                selectedDex: quote.dex,
            });
            await new Promise(resolve => setTimeout(resolve, 500));

            await updateStatus(orderId, 'submitted', {
                message: 'Transaction submitted. Simulated txHash appears.',
            });
            const result = await dexRouter.executeSwap(quote);

            await updateStatus(orderId, 'confirmed', {
                message: 'Transaction confirmed with final output.',
                txHash: result.txHash,
                dex: quote.dex,
                expectedOutput: quote.expectedOutput.toFixed(4),
                actualOutput: result.actualOutput.toFixed(4),
            });

            await prisma.userOrder.update({
                where: { id: orderId },
                data: {
                    status: 'confirmed',
                    result: {
                        txHash: result.txHash,
                        dex: quote.dex,
                        expectedOutput: quote.expectedOutput,
                        actualOutput: result.actualOutput,
                    },
                },
            });

            console.log(`[Worker] Order ${orderId} completed successfully`);

        } catch (error: any) {
            console.error(`[Worker] Job ${job.id} failed (Attempt ${job.attemptsMade + 1}):`, error.message);
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 10,
        limiter: {
            max: 100,
            duration: 60000,
        },
    }
);

orderWorker.on('failed', async (job, err) => {
    if (job && (job.attemptsMade >= (job.opts.attempts || 3))) {
        await updateStatus(job.data.orderId, 'failed', { error: err.message });
        await prisma.userOrder.update({
            where: { id: job.data.orderId },
            data: { status: 'failed', result: { error: err.message } }
        });
    }
});

async function updateStatus(orderId: string, status: string, data?: any) {
    await prisma.executionLog.create({
        data: {
            orderId,
            status,
            message: JSON.stringify(data || {}),
        },
    });

    broadcastStatus(orderId, status, data);
}
