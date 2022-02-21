import axios, { AxiosError } from 'axios';
import { Block, Txn } from '../block';
import { log } from '../logger';

const FCD_ENDPOINT_PER_CHAIN: { [chainId: string]: string } = {
  'columbus-5': 'https://fcd.terra.dev/',
  'bombay-12': 'https://bombay-fcd.terra.dev/',
};

type GetBlockResponse = {
  chainId: string;
  timestamp: string;
  height: number;
  txs: Txn[];
} | null;

export interface GetTxsOptions {
  offset: number;
  limit: number;
}

export interface GetTxsResponse {
  next?: number;
  limit: number;
  txs: Txn[];
}

export class FCDClient {
  public endpoint: string;

  constructor(endpoint?: string) {
    // remove trailing slash
    this.endpoint = (endpoint ?? FCD_ENDPOINT_PER_CHAIN['columbus-5']).replace(/\/$/, '');
  }

  static byChainId(chainId: string): FCDClient {
    const endpoint = FCD_ENDPOINT_PER_CHAIN[chainId];
    if (!endpoint) {
      throw new Error(
        `unknown chain: ${chainId}. supported chains are: ${Object.keys(FCD_ENDPOINT_PER_CHAIN).join(', ')}`,
      );
    }
    return new FCDClient(endpoint);
  }

  static mainnet = (): FCDClient => FCDClient.byChainId('columbus-5');
  static testnet = (): FCDClient => FCDClient.byChainId('bombay-12');

  async getBlockAt(height: number): Promise<Block | undefined> {
    const { result, error } = await this.get<GetBlockResponse>(`/v1/blocks/${height}`);
    if (!result) {
      // block not available, yet
      return;
    }
    if (error) {
      log('error', 'FCDClient', `failed to get block ${height}`, { error });
      return;
    }
    return {
      height: result.height,
      timestamp: new Date(result.timestamp),
      transactions: result.txs.map((tx) => ({ ...tx, height: Number(tx.height) })),
    };
  }

  async getTransactionsOf(account: string, options: Partial<GetTxsOptions> = {}): Promise<GetTxsResponse> {
    const { result, error } = await this.get<GetTxsResponse>(`/v1/txs`, { account, ...options });
    if (error || !result) {
      throw error;
    }
    return result;
  }

  private async get<T>(path: string, queryParams = {}): Promise<{ result?: T; error?: AxiosError }> {
    try {
      const { data, status } = await axios.get(`${this.endpoint}/${path.replace(/^\//, '')}`, {
        params: queryParams,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      return { result: data };
    } catch (err) {
      return { error: err as AxiosError };
    }
  }
}
