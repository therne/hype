import { SaveOptions } from 'typeorm/repository/SaveOptions';
import { Block } from '../../block';
import { SubscriberFn } from '../../Hype';
import { createPersistentIndexer, PersistentIndexerOptions } from '../persistence';

// eslint-disable-next-line @typescript-eslint/ban-types
type ObjectType<T> = { new (): T } | Function;

/**  Same as Partial<T> but goes deeper and makes Partial<T> all its properties and sub-properties. */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]> | T[P];
};

interface TypeORMEntity<T> {
  new (): T;
  save<T>(this: ObjectType<T>, entities: T[], options?: SaveOptions): Promise<T[]>;
  create<T>(this: ObjectType<T>, entityLike: DeepPartial<T>): T;
}

export function createTypeORMIndexer<T>(
  entity: TypeORMEntity<T>,
  mapper: (block: Block) => Promise<DeepPartial<T>[]> | DeepPartial<T>[],
  options: Partial<PersistentIndexerOptions> = {},
): SubscriberFn {
  const indexerOptions = { logTag: entity.constructor.name, ...options };
  const persister = (entities: T[]) => entity.save(entities);

  const mapperWithEntityCreation = async (block: Block) => {
    const entityLikes = await mapper(block);
    return entityLikes.map((entityLike) => entity.create(entityLike));
  };
  return createPersistentIndexer(mapperWithEntityCreation, persister, indexerOptions);
}
