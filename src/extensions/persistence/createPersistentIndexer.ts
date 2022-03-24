import { Block } from '../../block';
import { SubscriberFn } from '../../Hype';
import { log } from '../../logger';
import { assignOptions, BufferedQueue } from '../../utils';

export interface PersistentIndexerOptions {
  /** override the log tag **/
  logTag?: string;

  /** whether to use batch mode. {@see createBatchPersistentIndexer} */
  useBatch: boolean;

  /** how often a batch should be flushed. (default: 7000ms) */
  batchFlushIntervalInMs: number;

  /** a batch is automatically flushed as its size reaches `maxItemsPerBatch`. (default: 256 items/batch) */
  maxItemsPerBatch: number;
}

const defaultPersistentIndexerOptions: PersistentIndexerOptions = {
  useBatch: false,
  batchFlushIntervalInMs: 7000,
  maxItemsPerBatch: 256,
};

/**
 * Creates an Hype subscriber that persists outputs returned from given {@link mapper} function.
 *
 * The persistent indexer has two modes:
 *  1. On-demand (default): Persists outputs block by block.
 *  2. Batch Mode: Collects outputs for some period and persists in bulk.
 *  These modes can be controlled by {@link PersistentIndexerOptions.useBatch} option.
 *
 * @param mapper A function returns outputs by indexing event logs or transactions from a block.
 * @param persister A function persists outputs returned from {@link mapper}.
 * @param options Options. {@see PersistentIndexerOptions}
 * @returns A subscriber function. {@see SubscriberFn}
 */
export function createPersistentIndexer<T>(
  mapper: (block: Block) => Promise<T[]> | T[],
  persister: (outputs: T[]) => Promise<unknown>,
  options: Partial<PersistentIndexerOptions> = {},
): SubscriberFn {
  const indexerOptions = assignOptions(defaultPersistentIndexerOptions, options);
  const { useBatch, logTag } = indexerOptions;

  if (useBatch) {
    return createBatchPersistentIndexer(mapper, persister, indexerOptions);
  }

  return async (block: Block, subscriptionId: string) => {
    const start = Date.now();

    const outputs = await mapper(block);
    await persister(outputs);

    const logMsg = outputs.length === 0 ? 'no results' : 'saved results';
    log('info', logTag ?? subscriptionId, logMsg, {
      height: block.height,
      outputCount: outputs.length,
      elapsedMs: Date.now() - start,
    });
  };
}

function createBatchPersistentIndexer<T>(
  mapper: (block: Block) => Promise<T[]> | T[],
  persister: (entities: T[]) => Promise<unknown>,
  options: PersistentIndexerOptions,
): SubscriberFn {
  const { batchFlushIntervalInMs, maxItemsPerBatch } = options;
  let logTag = options.logTag;

  const batchQueue = new BufferedQueue<T>(
    async (items) => {
      log('info', logTag ?? 'BatchPersistentIndexer', 'flushing items to DB', { count: items.length });
      await persister(items);
    },
    batchFlushIntervalInMs,
    maxItemsPerBatch,
  );

  return async (block: Block, subscriptionId: string) => {
    if (!logTag) {
      logTag = subscriptionId;
    }
    const start = Date.now();

    const outputs = await mapper(block);
    await batchQueue.push(outputs);

    const logMsg = outputs.length === 0 ? 'no results' : 'saved results';
    log('info', logTag, logMsg, {
      height: block.height,
      outputCount: outputs.length,
      elapsedMs: Date.now() - start,
    });
  };
}

/**
 * Flushes batch-persistence items if any left.
 * Should be called after a batch indexer finishes.
 */
export async function flushBatchPersistenceItems(): Promise<void> {
  await BufferedQueue.flushAll();
}
