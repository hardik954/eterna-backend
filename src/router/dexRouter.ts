import { randomUUID } from 'crypto';

interface Quote {
    dex: string;
    price: number;
    expectedOutput: number;
    minOutput: number;
    raydiumPrice: number;
    meteoraPrice: number;
}

export class DexRouter {
    async getQuote(tokenIn: string, tokenOut: string, amount: number, slippageTolerance: number = 0.01): Promise<Quote> {
        const delay = Math.floor(Math.random() * 1000) + 2000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        const basePrice = 100;

        const raydiumPrice = basePrice * (1 + (Math.random() * 0.03 + 0.02) * (Math.random() > 0.5 ? 1 : -1));

        const meteoraPrice = basePrice * (1 + (Math.random() * 0.03 + 0.02) * (Math.random() > 0.5 ? 1 : -1));

        const quotes = [
            { dex: 'Raydium', price: raydiumPrice },
            { dex: 'Meteora', price: meteoraPrice },
        ];

        const bestQuote = quotes.reduce((prev, current) => (prev.price > current.price ? prev : current));

        const expectedOutput = bestQuote.price * amount;
        const minOutput = expectedOutput * (1 - slippageTolerance);

        console.log(`[Router] Routing ${amount} ${tokenIn} -> ${tokenOut}`);
        console.log(`[Router] Raydium: ${raydiumPrice.toFixed(4)}`);
        console.log(`[Router] Meteora: ${meteoraPrice.toFixed(4)}`);
        console.log(`[Router] Selected best = ${bestQuote.dex}`);
        console.log(`[Router] Expected output: ${expectedOutput.toFixed(4)}`);
        console.log(`[Router] Min output (with ${(slippageTolerance * 100).toFixed(2)}% slippage): ${minOutput.toFixed(4)}`);

        return {
            dex: bestQuote.dex,
            price: bestQuote.price,
            expectedOutput,
            minOutput,
            raydiumPrice,
            meteoraPrice,
        };
    }

    async executeSwap(quote: Quote): Promise<{ txHash: string; actualOutput: number }> {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const priceVariation = (Math.random() * 0.004 - 0.002);
        const actualOutput = quote.expectedOutput * (1 + priceVariation);

        if (actualOutput < quote.minOutput) {
            throw new Error(`Slippage exceeded: actual output ${actualOutput.toFixed(4)} < minimum ${quote.minOutput.toFixed(4)}`);
        }

        return {
            txHash: `MOCK_TX_${randomUUID()}`,
            actualOutput,
        };
    }
}

export const dexRouter = new DexRouter();
