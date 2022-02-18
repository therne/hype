import BlockFetcher from './BlockFetcher';
import { Block } from '../../block';
import { FCDClient } from '../../utils';

export default class FCDBlockFetcher implements BlockFetcher {
  constructor(private readonly fcd: FCDClient) {}

  static mainnet = (): BlockFetcher => new FCDBlockFetcher(FCDClient.mainnet());
  static testnet = (): BlockFetcher => new FCDBlockFetcher(FCDClient.testnet());

  fetchBlockAt = async (height: number): Promise<Block | undefined> => this.fcd.getBlockAt(height);
}
