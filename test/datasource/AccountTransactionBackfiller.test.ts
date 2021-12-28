import { loadTransactionsOfAccount } from '../../src';

describe('Testing loadTransactionsOfAccount', () => {
  it('should return blocks if transactions available on the account', async () => {
    const result = await loadTransactionsOfAccount('terra19vnwdqz4um0z8f69pc8y0z4ncrcxm4cjf3gevz', {
      offset: 140308160,
      limit: 10,
      fromBlock: 4231834,
      toBlock: 4231997,
    });
    const blockStream = result.blocks();

    const { value: block1 } = await blockStream.next();

    expect(block1.height).toBe(4231834);
    expect(block1.timestamp.toISOString()).toBe('2021-08-22T08:37:57.000Z');
    expect(block1.transactions).not.toBeNull();

    const { value: block2 } = await blockStream.next();
    expect(block2.height).toBe(4231996);

    const { done } = await blockStream.next();
    expect(done).toBeTruthy();
  });
});
