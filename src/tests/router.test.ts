import { DexRouter } from '../router/dexRouter';

describe('DexRouter', () => {
    let router: DexRouter;

    beforeEach(() => {
        router = new DexRouter();
    });

    it('should return a quote with a valid price and dex', async () => {
        const quote = await router.getQuote('SOL', 'USDC', 1);
        expect(quote).toHaveProperty('dex');
        expect(quote).toHaveProperty('price');
        expect(['Raydium', 'Meteora']).toContain(quote.dex);
        expect(quote.price).toBeGreaterThan(0);
    });

    it('should return a mock transaction hash on execution', async () => {
        const quote = { dex: 'Raydium', price: 100 };
        const txHash = await router.executeSwap(quote);
        expect(txHash).toMatch(/^MOCK_TX_/);
    });
});
