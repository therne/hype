import { HiveBlockFetcher } from '../src';

describe('Testing BlockFetcher', () => {
  const blockFetcher = new HiveBlockFetcher();

  it('should return block if block is available', async () => {
    const block = await blockFetcher.fetchBlockAt(4980471);
    expect(block?.height).toEqual(4980471);
    expect(block?.timestamp?.toISOString()).toEqual('2021-10-20T17:31:34.367Z');
  });

  it('should return block if block is available but no transactions', async () => {
    const block = await blockFetcher.fetchBlockAt(5079042);
    expect(block?.height).toEqual(5079042);
    expect(block?.timestamp).not.toBeNull();
  });

  it('should return null if block is not available yet', async () => {
    const block = await blockFetcher.fetchBlockAt(999999999);
    expect(block).toBeUndefined();
  });
});
