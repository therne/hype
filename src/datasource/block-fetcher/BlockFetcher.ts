import { Block } from '../../block';

export default interface BlockFetcher {
  fetchBlockAt(height: number): Promise<Block | undefined>;
}
