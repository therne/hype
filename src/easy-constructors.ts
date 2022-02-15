import { BlockPoller, BlockPollerOptions, LCDBlockFetcher, saveLastSyncedHeightInMemory } from './datasource';
import { Hype } from './Hype';

interface CreateRealtimeHypeOptions {
  lcdUrl: string;
  startHeight: number;
  blockPollerOptions: Partial<BlockPollerOptions>;
}

export async function createRealtimeHype(options: Partial<CreateRealtimeHypeOptions> = {}): Promise<Hype> {
  const lcdBlockFetcher = new LCDBlockFetcher(options.lcdUrl);

  const startHeight =
    options.startHeight ?? Number((await lcdBlockFetcher.fetchBlockHeader('latest')).block.header.height);

  const blockPoller = new BlockPoller(
    lcdBlockFetcher,
    saveLastSyncedHeightInMemory(startHeight),
    options.blockPollerOptions,
  );
  return new Hype(blockPoller);
}
