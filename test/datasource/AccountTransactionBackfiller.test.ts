import { loadTransactionsOfAccount } from '../../src';

describe('Testing loadTransactionsOfAccount', () => {
  it('should return blocks if transactions available on the account', async () => {
    const blocks = await loadTransactionsOfAccount('terra10jrv8wy6s06mku9t6yawt2yr09wjlqsw0qk0vf').blocks();
    const block = (await blocks.next()).value;
    expect(block?.height).not.toBeNull();
    expect(block?.transactions).not.toBeNull();
    console.log(block);
  });
});
