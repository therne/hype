import { Block } from '../../block';
import { SubscriberFn } from '../../Hype';
import { SaveOptions } from 'typeorm/repository/SaveOptions';
import { log } from '../../logger';
import { BufferedQueue } from '../../utils';

// eslint-disable-next-line @typescript-eslint/ban-types
type ObjectType<T> = { new (): T } | Function;

interface PersistentEntity<T> {
  new (): T;
  save<T>(this: ObjectType<T>, entities: T[], options?: SaveOptions): Promise<T[]>;
}

export interface PersistentIndexerOptions {
  useBatch: boolean;
  batchFlushIntervalInMs: number;
  maxItemsPerBatch: number;
}

const defaultPersistentIndexerOptions: PersistentIndexerOptions = {
  useBatch: false,
  batchFlushIntervalInMs: 7000,
  maxItemsPerBatch: 256,
};

export function createPersistentIndexer<T>(
  entity: PersistentEntity<T>,
  mapper: (block: Block) => Promise<T[]>,
  options: Partial<PersistentIndexerOptions> = {},
): SubscriberFn {
  const { useBatch, batchFlushIntervalInMs, maxItemsPerBatch } = Object.assign(
    defaultPersistentIndexerOptions,
    options,
  );

  const batchQueue = new BufferedQueue<T>(
    async (items) => {
      log('info', entity.name, 'flushing items to DB', { count: items.length });
      await entity.save(items);
    },
    batchFlushIntervalInMs,
    maxItemsPerBatch,
  );

  return async (block: Block, subscriptionId: string) => {
    const start = Date.now();

    const outputs = await mapper(block);
    await (useBatch ? batchQueue.push(outputs) : entity.save(outputs));

    const logMsg = outputs.length === 0 ? 'no results' : 'saved results';
    log('info', subscriptionId, logMsg, {
      height: block.height,
      outputCount: outputs.length,
      elapsedMs: Date.now() - start,
    });
  };
}
