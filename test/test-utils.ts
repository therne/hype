import tmp from 'tmp-promise';
import { Connection, createConnection } from 'typeorm';
import { EntitySchema } from 'typeorm/entity-schema/EntitySchema';
import { Block } from '../src';

export async function setupTestORM(entities: (Function | string | EntitySchema)[]): Promise<Connection> {
  const { path } = await tmp.dir();
  return createConnection({
    type: 'sqlite',
    database: `${path}/test.db`,
    entities,
    synchronize: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadFixtureBlock(fixtureBlock: Record<string, any>): Block {
  return {
    height: fixtureBlock.height,
    timestamp: new Date(fixtureBlock.timestamp),
    transactions: fixtureBlock.transactions,
  };
}
