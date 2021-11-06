import { Block } from '../block';
import { BlockFetcher } from '../block-fetcher';
import BlockDataSource from './BlockDataSource';
import { LastSyncedHeightRepository } from './LastSyncedHeightRepository';
import { log } from '../logger';

export interface BlockPollerOptions {
  intervalInMs: number;
  maxRetry: number;
}

const defaultBlockPollerOptions: BlockPollerOptions = {
  intervalInMs: 5000,
  maxRetry: 20,
};

export default class BlockPoller implements BlockDataSource {
  public readonly options: BlockPollerOptions;

  constructor(
    public blockFetcher: BlockFetcher,
    public lastSyncedHeightRepository: LastSyncedHeightRepository,
    options: Partial<BlockPollerOptions> = {},
  ) {
    this.options = Object.assign(defaultBlockPollerOptions, options);
  }

  async *blocks(): AsyncGenerator<Block> {
    const lastSyncedHeight = await this.lastSyncedHeightRepository.load();

    for (let height = lastSyncedHeight + 1; ; height++) {
      const block = await withRetryAndDelay(this.options.maxRetry, this.options.intervalInMs, () =>
        this.blockFetcher.fetchBlockAt(height),
      );
      if (!block) {
        throw new Error(`block ${height} not available`);
      }
      log('trace', 'block-poller', 'polled block', {
        height: block.height,
        timestamp: block.timestamp,
        syncLagMs: Date.now() - +block.timestamp,
      });
      yield block;
      await this.lastSyncedHeightRepository.save(height);
    }
  }
}

async function withRetryAndDelay<T>(
  maxAttempts: number,
  delayMs: number,
  fn: () => Promise<T>,
): Promise<T | undefined> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const val = await fn();
    if (val == null) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }
    return val;
  }
  return;
}
