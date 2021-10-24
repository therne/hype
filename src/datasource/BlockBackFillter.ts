import BlockDataSource from './BlockDataSource';
import { BlockFetcher } from '../block-fetcher';
import { Block } from '../block';

export default class BlockBackFiller implements BlockDataSource {
  constructor(public blockFetcher: BlockFetcher, public from: number, public to: number) {}

  async *blocks(): AsyncGenerator<Block> {
    for (let height = this.from; height < this.to; height++) {
      const block = await this.blockFetcher.fetchBlockAt(height);
      if (!block) {
        throw new Error(`block ${height} not available`);
      }
      yield block;
    }
  }
}
