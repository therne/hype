import fixtureBlock from '../../fixtures/5036118.json';
import { extractEventsInBlock } from '../../../src/extensions/log-finder';
import { createReturningLogFinder } from '@terra-money/log-finder';
import { loadFixtureBlock } from '../../test-utils';

describe('Test extractEventsInBlock()', () => {
  const block = loadFixtureBlock(fixtureBlock);

  it('should extract events by filtering, transforming event', () => {
    const finder = createReturningLogFinder(
      {
        type: 'from_contract',
        attributes: [['contract_address'], ['action', 'claim'], ['stage'], ['address'], ['amount']],
      },
      (_, match) => ({
        contract: match[0].value,
        stage: match[2].value,
        address: match[3].value,
        amount: match[4].value,
      }),
    );
    const events = extractEventsInBlock(block, [finder]);
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      txHash: '4D44BB1D7E87A20D54B4866502A3D2A48853FA0E6A2D08A24A9C5462E160BE95',
      event: {
        contract: 'terra1ud39n6c42hmtp2z0qmy8svsk7z3zmdkxzfwcf2',
        stage: '16',
        address: 'terra13tcy4fyrmvc4j2nh62xg7qmx7hpw82whgzg0vy',
        amount: '421871494',
      },
    });
    expect(events[1]).toEqual({
      txHash: '8E3983637737F698F27CF48924A9B4BE143EB6A58B247FE3123459891B567245',
      event: {
        contract: 'terra146ahqn6d3qgdvmj8cj96hh03dzmeedhsf0kxqm',
        stage: '29',
        address: 'terra1gd2a7jy5zhexepj7trwvytnr0v52g9z9hwfvuz',
        amount: '1003297',
      },
    });
  });
});
