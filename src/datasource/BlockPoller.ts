import { Block } from '../block';
import { BlockFetcher } from '../block-fetcher';
import BlockDataSource from './BlockDataSource';

interface LastSyncedHeightRepository {
  load(): Promise<number>;
  save(height: number): Promise<void>;
}

export const createStaticLastSyncedHeightRepository = (initialHeight: number): LastSyncedHeightRepository => ({
  async load(): Promise<number> {
    return initialHeight;
  },
  async save(height: number): Promise<void> {},
});

export interface BlockPollerOptions {
  intervalInMs: number;
  maxRetry: number;
}

const defaultBlockPollerOptions: BlockPollerOptions = {
  intervalInMs: 7000,
  maxRetry: 3,
};

export default class BlockPoller implements BlockDataSource {
  public readonly options: BlockPollerOptions;

  constructor(
    public blockFetcher: BlockFetcher,
    public lastSyncedHeightRepository: LastSyncedHeightRepository,
    options: Partial<BlockPollerOptions>,
  ) {
    this.options = Object.assign(defaultBlockPollerOptions, options);
  }

  async *blocks(): AsyncGenerator<Block> {
    const lastSyncedHeight = await this.lastSyncedHeightRepository.load();

    for (let height = lastSyncedHeight + 1; ; height++) {
      const block = await withRetry(this.options.maxRetry, () =>
        withDelay(this.options.intervalInMs, () => this.blockFetcher.fetchBlockAt(height)),
      );
      if (!block) {
        throw new Error(`block ${height} not available`);
      }
      yield block;
      await this.lastSyncedHeightRepository.save(height);
    }
  }
}

async function withRetry<T>(maxAttempts: number, fn: () => Promise<T>): Promise<T | undefined> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const val = await fn();
    if (val == null) {
      continue;
    }
    return val;
  }
  return;
}

async function withDelay<T>(ms: number, fn: () => Promise<T>): Promise<T> {
  const val = await fn();
  await new Promise((resolve) => setTimeout(resolve, ms));
  return val;
}
