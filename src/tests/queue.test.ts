import { orderQueue, addOrderToQueue } from '../queue/orderQueue';

// Mock BullMQ
jest.mock('bullmq', () => {
    return {
        Queue: jest.fn().mockImplementation(() => ({
            add: jest.fn(),
        })),
        Worker: jest.fn(),
    };
});

describe('OrderQueue', () => {
    it('should add order to queue', async () => {
        const orderId = 'test-order-id';
        const orderData = { inputToken: 'SOL', outputToken: 'USDC', amount: 1 };

        await addOrderToQueue(orderId, orderData);

        expect(orderQueue.add).toHaveBeenCalledWith('execute-order', {
            orderId,
            ...orderData,
        });
    });
});
