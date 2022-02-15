import { LCDBlockFetcher } from '../../../src';

describe('Testing LCDBlockFetcher', () => {
  const blockFetcher = new LCDBlockFetcher();

  describe('given a block that exist', () => {
    it('should fetch data if available', async () => {
      const block = await blockFetcher.fetchBlockAt(4980471);
      expect(block?.height).toEqual(4980471);
      expect(block?.timestamp?.toISOString()).toEqual('2021-10-20T17:31:34.367Z');
      expect(block?.transactions?.length).toEqual(23);
    });

    it('should fetch even if the block has no transactions', async () => {
      const block = await blockFetcher.fetchBlockAt(5079042);
      expect(block?.height).toEqual(5079042);
      expect(block?.timestamp?.toISOString()).toEqual('2021-10-28T12:57:00.235Z');
    });
  });

  describe("given a block that doesn't exist", () => {
    it('should return null', async () => {
      const block = await blockFetcher.fetchBlockAt(999999999);
      expect(block).toBeUndefined();
    });
  });

  describe('fetchBlockHeader', () => {
    it('should fetch latest block', async () => {
      const header = await blockFetcher.fetchBlockHeader('latest');
      expect(Number(header.block.header.height)).toBeGreaterThanOrEqual(6486271);
    });

    it('should fetch a block at specific height', async () => {
      const header = await blockFetcher.fetchBlockHeader(6486000);
      expect(header.block.header.height).toEqual('6486000');
    });
  });
});
