import { ClientError, gql, GraphQLClient } from 'graphql-request';
import { Block, Txn } from './block';

export interface BlockFetcher {
  fetchBlockAt(height: number): Promise<Block | undefined>;
}

const HIVE_COLUMBUS_5 = 'https://hive.terra.dev/graphql';

const FETCH_BLOCK_QUERY = gql`
  query ($height: Float!) {
    tx {
      byHeight(height: $height) {
        txhash
        height
        timestamp
        logs {
          msg_index
          events {
            type
            attributes {
              key
              value
            }
          }
        }
      }
    }
  }
`;

interface FetchBlockQueryResponse {
  tx: {
    byHeight: Txn[];
  };
}

const FETCH_BLOCK_HEADER_QUERY = gql`
  query ($height: Int) {
    tendermint {
      blockInfo(height: $height) {
        block {
          header {
            time
          }
        }
      }
    }
  }
`;

interface FetchBlockHeaderQueryResponse {
  tendermint: {
    blockInfo: {
      block: {
        header: {
          time: string;
        };
      };
    };
  };
}

export class HiveBlockFetcher implements BlockFetcher {
  private readonly client: GraphQLClient;

  constructor(endpoint = HIVE_COLUMBUS_5) {
    this.client = new GraphQLClient(endpoint);
  }

  async fetchBlockAt(height: number): Promise<Block | undefined> {
    try {
      const data: FetchBlockQueryResponse = await this.client.request(FETCH_BLOCK_QUERY, { height });
      const transactions = data.tx.byHeight;

      // use timestamp in first txn or fetch block header
      const timestamp = transactions.length > 0
        ? new Date(transactions[0].timestamp)
        : await this.fetchBlockTimestamp(height);

      return {
        height,
        timestamp,
        transactions,
      };
    } catch (err) {
      if (this.isBlockNotFoundError(err as ClientError)) {
        return;
      }
      throw err;
    }
  }

  private async fetchBlockTimestamp(height: number): Promise<Date> {
    const data: FetchBlockHeaderQueryResponse = await this.client.request(FETCH_BLOCK_HEADER_QUERY, { height });
    return new Date(data.tendermint.blockInfo.block.header.time);
  }

  isBlockNotFoundError(err: ClientError): boolean {
    return !!(err?.response?.errors && err.response.errors[0].message === 'Request failed with status code 500');
  }
}
