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

export const loadTransactionsOfAccount = (account: string, endpoint = FCD_MAINNET): BlockDataSource => {
  return {
    async *blocks(): AsyncGenerator<Block> {
      let offset: number | undefined = 0;
      let page = 0;
      const limit = 100;
      while (offset != null) {
        log('info', 'fcd-backfiller', `loading page ${page}`, { offset });

        const resp = await axios.get(`${endpoint}/v1/txs?offset=${offset}&limit=${limit}&account=${account}`);
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

        for (const block of blocks) {
          yield block;
        }
        await sleep(1000);
        offset = next;
        page++;
      }
    }
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
