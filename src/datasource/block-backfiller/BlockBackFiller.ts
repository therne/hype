import BlockDataSource from '../BlockDataSource';
import { BlockFetcher } from '../block-fetcher';
import { Block } from '../../block';
import { log } from '../../logger';
import { assignOptions } from '../../utils';

export interface BlockBackFillerOptions {
  interval: number;
  maxRetry: number;
  retryIntervalInMs: number;
}

const defaultBlockPollerOptions: BlockBackFillerOptions = {
  interval: 0,
  maxRetry: 10,
  retryIntervalInMs: 20000,
};

export default class BlockBackFiller implements BlockDataSource {
  public readonly options: BlockBackFillerOptions;

  constructor(
    public blockFetcher: BlockFetcher,
    public from: number,
    public to: number,
    options: Partial<BlockBackFillerOptions> = {},
  ) {
    this.options = assignOptions(defaultBlockPollerOptions, options);
  }

  async *blocks(): AsyncGenerator<Block> {
    for (let height = this.from; height < this.to; height++) {
      yield await this.fetchWithRetry(height);
    }
  }

  private async fetchWithRetry(height: number): Promise<Block> {
    for (let attempt = 0; attempt < this.options.maxRetry; attempt++) {
      try {
        const block = await this.blockFetcher.fetchBlockAt(height);
        if (!block) {
          throw new Error(`block ${height} not available`);
        }
        if (this.options.interval > 0) {
          await sleep(this.options.interval);
        }
        return block;
      } catch (err) {
        log('error', 'block-backfiller', `error while fetching a block`, { height, attempt, error: err });
        await sleep(this.options.retryIntervalInMs);
      }
    }
    throw new Error(`maximum retry attempt ${this.options.maxRetry} exceeded while fetching block #${height}`);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
