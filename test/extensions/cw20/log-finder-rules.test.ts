import { createCw20SendLogFinder } from '../../../src/extensions/cw20';
import { HiveBlockFetcher } from '../../../src';
import { extractEventsInBlock } from '../../../src/extensions/log-finder';

const ANC_TOKEN = 'terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76';

describe('createCw20SendLogFinder()', () => {
  const hive = new HiveBlockFetcher();
  const tokenSendFinder = createCw20SendLogFinder(ANC_TOKEN);

  it('should extract the send log correctly', async () => {
    const block = await hive.fetchBlockAt(6489827);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const events = extractEventsInBlock(block!, [tokenSendFinder]);
    expect(events).toHaveLength(2);
  });
});
