import BlockDataSource from './BlockDataSource';
import { Block, Txn } from '../block';
import { log } from '../logger';
import axios from 'axios';
import { groupBy } from 'lodash';

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
}

const defaultOptions: LoadTransactionsOfAccountOptions = {
  endpoint: FCD_MAINNET,
  fromBlock: 0,
  toBlock: Number.MAX_VALUE,
  sleepMs: 1000,
  offset: 0,
  limit: 100,
};

export const loadTransactionsOfAccount = (
  account: string,
  options: Partial<LoadTransactionsOfAccountOptions> = {},
): BlockDataSource => {
  const { endpoint, fromBlock, toBlock, sleepMs, offset, limit } = Object.assign(options, defaultOptions);

  return {
    async *blocks(): AsyncGenerator<Block> {
      let currentOffset: number | undefined = offset;
      let page = 0;
      while (currentOffset != null) {
        log('info', 'fcd-backfiller', `loading page #${page}`, { offset: currentOffset });

        const resp = await axios.get(`${endpoint}/v1/txs?offset=${currentOffset}&limit=${limit}&account=${account}`);
        const { next, txs } = resp.data as FCDResponse;
        if (txs.length === 0) {
          return;
        }

        // group transactions in the account as a virtual block
        const blocks = Object.values(groupBy(txs, 'height'))
          .map((transactions) => ({
            timestamp: new Date(transactions[0].timestamp),
            height: Number(transactions[0].height),
            transactions,
          }))
          .filter(({ height }) => fromBlock <= height && height < toBlock);

        for (const block of blocks) {
          yield block;
        }
        await sleep(sleepMs);
        currentOffset = next;
        page++;
      }
    },
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
