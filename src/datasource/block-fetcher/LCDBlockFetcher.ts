import BlockFetcher from './BlockFetcher';
import { Block, Txn } from '../../block';
import axios, { AxiosError } from 'axios';
import { log } from '../../logger';

const DEFAULT_MAINNET_LCD = 'https://lcd.terra.dev';

export interface LCDClientLike {
  config: {
    URL: string;
  };
}

export interface LCDBlockHeader {
  block: {
    header: {
      chain_id: string;
      height: string;
      time: string;
      num_txs: number;
      last_block_id: {
        hash: string;
        parts: {
          total: number;
          hash: string;
        };
      };
      total_txs: number;
      last_commit_hash: string;
      data_hash: string;
      validators_hash: string;
      next_validators_hash: string;
      consensus_hash: string;
      app_hash: string;
      last_results_hash: string;
      evidence_hash: string;
      proposer_address: string;
      version: {
        block: number;
        app: number;
      };
    };
  };
}

type LCDResponse = Txn[];

export default class LCDBlockFetcher implements BlockFetcher {
  private readonly endpoint: string;

  constructor(endpointUrl = DEFAULT_MAINNET_LCD) {
    // remove trailing slash
    this.endpoint = endpointUrl.replace(/\/$/, '');
  }

  static fromLCD(lcd: LCDClientLike): LCDBlockFetcher {
    const {
      config: { URL: url },
    } = lcd;
    return new LCDBlockFetcher(url);
  }

  async fetchBlockAt(height: number): Promise<Block | undefined> {
    try {
      const { data } = await axios.get(`${this.endpoint}/index/tx/by_height/${height}`);
      const transactions = data as LCDResponse;

      // use timestamp in first txn or fetch block header
      const timestamp =
        transactions.length > 0 ? new Date(transactions[0].timestamp) : await this.fetchBlockTimestamp(height);

      return {
        height,
        timestamp,
        transactions,
      };
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.status === 400) {
        // not available yet
        return;
      }
      log('error', 'LCDBlockFetcher', 'failed to fetch block from LCD', {
        height,
        error: (err as AxiosError)?.response?.data ?? err,
      });
      return;
    }
  }

  async fetchBlockHeader(height: number | 'latest'): Promise<LCDBlockHeader> {
    const { data } = await axios.get(`${this.endpoint}/blocks/${height}`);
    return data;
  }

  private async fetchBlockTimestamp(height: number): Promise<Date> {
    const {
      block: {
        header: { time },
      },
    } = await this.fetchBlockHeader(height);
    return new Date(time);
  }
}
