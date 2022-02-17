import BlockDataSource from './BlockDataSource';
import { Block, Txn } from '../block';
import { log } from '../logger';
import axios from 'axios';
import { every, groupBy, max, min } from 'lodash';
import { assignOptions } from '../utils';

const FCD_MAINNET = 'https://fcd.terra.dev';

interface FCDResponse {
  next?: number;
  limit: number;
  txs: Txn[];
}

export interface LoadTransactionsOfAccountOptions {
  endpoint: string;
  fromBlock: number;
  toBlock: number;
  sleepMs: number;
  offset: number;
  limit: number;
  maxRetry: number;
}

const defaultOptions: LoadTransactionsOfAccountOptions = {
  endpoint: FCD_MAINNET,
  fromBlock: 0,
  toBlock: Number.MAX_VALUE,
  sleepMs: 1000,
  offset: 0,
  limit: 100,
  maxRetry: 5,
};

export const loadTransactionsOfAccount = (
  account: string,
  options: Partial<LoadTransactionsOfAccountOptions> = {},
): BlockDataSource => {
  const { endpoint, fromBlock, toBlock, sleepMs, offset, limit, maxRetry } = assignOptions(defaultOptions, options);

  return {
    async *blocks(): AsyncGenerator<Block> {
      let currentOffset: number | undefined = offset;
      let page = 0;
      let retry = 0;
      while (currentOffset != null) {
        try {
          log('info', 'fcd-backfiller', `loading page #${page}`, { offset: currentOffset });

          const resp = await axios.get(`${endpoint}/v1/txs?offset=${currentOffset}&limit=${limit}&account=${account}`);
          const { next, txs } = resp.data as FCDResponse;
          if (txs.length === 0) {
            return;
          }

          // group transactions in the account as a virtual block
          const blocks = Object.values(groupBy(txs, 'height')).map((transactions) => ({
            timestamp: new Date(transactions[0].timestamp),
            height: Number(transactions[0].height),
            transactions,
          }));

          if (every(blocks, ({ height }) => height < fromBlock)) {
            const maxHeight = max(blocks.map(({ height }) => height));
            log(
              'trace',
              'fcd-backfiller',
              `block height (max ${maxHeight}) is lower than ${fromBlock}. quitting...`,
              {},
            );
            return;
          }
          if (every(blocks, ({ height }) => height >= toBlock)) {
            const minHeight = min(blocks.map(({ height }) => height));
            log('trace', 'fcd-backfiller', `block height (min ${minHeight}) is greater than ${toBlock}. skipping`, {});
          }

          const blocksInRange = blocks.filter(({ height }) => fromBlock <= height && height < toBlock);
          for (const block of blocksInRange) {
            yield block;
          }
          await sleep(sleepMs);
          currentOffset = next;
          page++;
          retry = 0;
        } catch (err) {
          if (retry >= maxRetry) {
            log('error', 'fcd-backfiller', `max retry attempt ${maxRetry} exceeded`, {});
            throw err;
          }
          const error = (err as Error).message;
          if (error.includes('429')) {
            await sleep(60000);
          }
          log('error', 'fcd-backfiller', `load failed`, { offset: currentOffset, error });
          retry++;

          // retry backoff
          await sleep(sleepMs * retry);
        }
      }
    },
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
