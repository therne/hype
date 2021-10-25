import { Block } from '../block';

export default interface BlockDataSource {
  blocks(): AsyncGenerator<Block>;
}

export const createStaticBlockDataSource = (blocks: Block[]): BlockDataSource => ({
  async *blocks(): AsyncGenerator<Block> {
    for (const block of blocks) {
      yield block;
    }
  },
});
