import { Block, Hype } from '../src';
import fixtureBlock from './fixtures/5036118.json';
import { createStaticBlockDataSource } from '../src/datasource/BlockDataSource';
import { createReturningLogFinder } from '@terra-money/log-finder';
import { findAndParseEvents } from '../src/extensions/log-finder';

interface ClaimAirdropLog {
  address: string;
  stage: number;
  amount: string;
}

describe('Testing Hype', () => {
  const block: Block = {
    height: fixtureBlock.height,
    timestamp: new Date(fixtureBlock.timestamp),
    // @ts-ignore
    transactions: fixtureBlock.transactions,
  };
  const hype = new Hype(createStaticBlockDataSource([block]));

  describe('start()', () => {
    it('should start processing blocks', async () => {
      let capturedOutputs: ClaimAirdropLog[] = [];
      hype.subscribe('pylon-buyback', async (block: Block) => {
        capturedOutputs = findAndParseEvents(block, [
          createReturningLogFinder(
            {
              type: 'from_contract',
              attributes: [
                ['contract_address', 'terra1ud39n6c42hmtp2z0qmy8svsk7z3zmdkxzfwcf2'],
                ['action', 'claim'],
                ['stage'],
                ['address'],
                ['amount'],
              ],
            },
            (_, match): ClaimAirdropLog => ({
              stage: Number(match[2].value),
              address: match[3].value,
              amount: match[4].value,
            }),
          ),
        ]);
      });

      await hype.start();
      expect(capturedOutputs).toHaveLength(1);
    });
  });

  describe('eventHandlers()', () => {
    test('on error, it should catch errors from subscriber', async () => {
      let capture: {err: Error, subscriptionId: string, block: Block} | undefined;
      hype.on('error', (err, subscriptionId, block) => {
        capture = { err, subscriptionId, block };
      });

      hype.subscribe('error-maker', async () => {
        throw new Error('no luck, man');
      });
      await hype.start();

      expect(capture).toBeTruthy();
      expect(capture?.err.message).toBe('no luck, man');
      expect(capture?.subscriptionId).toBe('error-maker');
    });
  });
});
