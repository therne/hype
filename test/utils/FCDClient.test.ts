import { FCDClient } from '../../src/utils';

const mineGovernanceAddr = 'terra1xu8utj38xuw6mjwck4n97enmavlv852zkcvhgp';

describe('Testing FCDClient', () => {
  const fcd = FCDClient.mainnet();

  describe('getBlockAt()', () => {
    describe('when block exists', () => {
      it('should return correct block data', async () => {
        const block = await fcd.getBlockAt(4980471);
        expect(block?.height).toEqual(4980471);
        expect(block?.timestamp?.toISOString()).toEqual('2021-10-20T17:31:34.367Z');
        expect(block?.transactions?.length).toBe(23);
        expect(block?.transactions[0].height).toBe(4980471);
      });
    });

    describe('when block exists but no transactions', () => {
      it('should return correct block data with correct timestamp', async () => {
        const block = await fcd.getBlockAt(5079042);
        expect(block?.height).toEqual(5079042);
        expect(block?.timestamp?.toISOString()).toEqual('2021-10-28T12:57:00.235Z');
      });
    });

    describe('when block exists but columbus-4', () => {
      it('should return correct block data', async () => {
        const block = await fcd.getBlockAt(4680471);
        expect(block?.height).toEqual(4680471);
        expect(block?.timestamp?.toISOString()).toEqual('2021-09-26T22:12:25.835Z');
      });
    });

    describe('when block does not exist', () => {
      it('should return undefined', async () => {
        const block = await fcd.getBlockAt(99999999);
        expect(block).toBeFalsy();
      });
    });
  });

  describe('getTransactionsOf()', () => {
    it('should list transactions of an account', async () => {
      const { next, txs, limit } = await fcd.getTransactionsOf(mineGovernanceAddr);
      expect(txs?.length).toBe(limit);
      expect(next).toBeTruthy();
    });
  });
});
