import { BufferedQueue } from '../../src/utils';
import { sleep } from '../test-utils';

const MAX_ITEMS = 5;
const INTERVAL_MS = 100;

describe('Testing BufferedQueue', () => {
  let flushedItemCount = 0;
  const queue = new BufferedQueue<number>(async (items) => (flushedItemCount += items.length), INTERVAL_MS, MAX_ITEMS);

  describe('when the interval is over', () => {
    it('should flush', async () => {
      flushedItemCount = 0;

      await queue.push([1]);
      expect(flushedItemCount).toBe(0);

      await sleep(INTERVAL_MS);

      await queue.push([2, 3]);
      expect(flushedItemCount).toBe(3);
    });
  });

  describe('when the queue is full', () => {
    it('should flush', async () => {
      flushedItemCount = 0;

      await queue.push([1, 2, 3]);
      expect(flushedItemCount).toBe(0);

      await queue.push([4, 5]);
      expect(flushedItemCount).toBe(5);
    });
  });
});
