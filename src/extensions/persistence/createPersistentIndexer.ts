import { Block } from '../../block';
import { SubscriberFn } from '../../Hype';
import { SaveOptions } from 'typeorm/repository/SaveOptions';
import { log } from '../../logger';

type ObjectType<T> = { new (): T } | Function;

interface PersistentEntity<T> {
  new (): T;
  save<T>(this: ObjectType<T>, entities: T[], options?: SaveOptions): Promise<T[]>;
}

export function createPersistentIndexer<T>(
  entity: PersistentEntity<T>,
  mapper: (block: Block) => Promise<T[]>,
): SubscriberFn {
  return async (block: Block, subscriptionId: string) => {
    const start = Date.now();

    const outputs = await mapper(block);
    await entity.save(outputs);

    const logMsg = outputs.length === 0 ? 'no results' : 'saved results';
    log(subscriptionId, logMsg, {
      height: block.height,
      outputCount: outputs.length,
      elapsedMs: Date.now() - start,
    });
  };
}
