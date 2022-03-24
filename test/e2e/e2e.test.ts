import { createReturningLogFinder } from '@terra-money/log-finder';
import 'reflect-metadata';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BlockBackFiller, HiveBlockFetcher, Hype } from '../../src';
import { extractEventsInBlock } from '../../src/extensions/log-finder';
import { createTypeORMIndexer } from '../../src/extensions/typeorm';
import { setupTestORM } from '../test-utils';

const TEST_BLOCK = 5036118;

@Entity()
class AirdropClaimLog extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  address!: string;

  @Column('int')
  stage!: number;

  @Column()
  amount!: string;
}

describe('E2E test', () => {
  it('should capture and results from block', async () => {
    await setupTestORM([AirdropClaimLog]);
    const datasource = new BlockBackFiller(new HiveBlockFetcher(), TEST_BLOCK, TEST_BLOCK + 1);

    await new Hype(datasource)
      .subscribe(
        'airdrop-claim-log',
        createTypeORMIndexer(AirdropClaimLog, async (block) =>
          extractEventsInBlock(block, [
            createReturningLogFinder(
              {
                type: 'from_contract',
                attributes: [
                  ['contract_address', 'terra1ud39n6c42hmtp2z0qmy8svsk7z3zmdkxzfwcf2'],
                  ['action', 'claim'],
                  ['stage'],
                  ['address'],
                  ['amount'],
                ],
              },
              (_, match) => ({
                stage: Number(match[2].value),
                address: match[3].value,
                amount: match[4].value,
              }),
            ),
          ]).map(({ event }) => event),
        ),
      )
      .start();

    const airdrops = await AirdropClaimLog.find();
    expect(airdrops).toHaveLength(1);
    expect(airdrops[0].address).toBe('terra13tcy4fyrmvc4j2nh62xg7qmx7hpw82whgzg0vy');
    expect(airdrops[0].stage).toBe(16);
  });
});
