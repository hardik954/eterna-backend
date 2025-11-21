import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const redisConnection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});

export const orderQueue = new Queue('order-queue', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export const addOrderToQueue = async (orderId: string, orderData: any) => {
    await orderQueue.add('execute-order', { orderId, ...orderData });
};
