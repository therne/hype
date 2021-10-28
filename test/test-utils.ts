import tmp from "tmp-promise";
import { Connection, createConnection } from "typeorm";
import { EntitySchema } from "typeorm/entity-schema/EntitySchema";

export async function setupTestORM(entities: ((Function | string | EntitySchema))[]): Promise<Connection> {
  const { path } = await tmp.dir();
  return createConnection({
    type: 'sqlite',
    database: `${path}/test.db`,
    entities,
    synchronize: true,
  });
}
