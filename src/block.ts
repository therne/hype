export interface Block {
  /**
   * The block's height.
   */
  height: number;

  /**
   * The block's timestamp. Timezone should be UTC and truncated in milliseconds.
   * (e.g. `2021-10-20T17:31:34.367Z`)
   */
  timestamp: Date;

  /**
   * Transactions in the block.
   */
  transactions: Txn[];
}

export interface Txn {
  txhash: string;
  height: number;
  timestamp: string; // ISO8601
  logs: {
    msg_index?: number;
    events: [];
  }[];
}

export interface TxnEvent {
  type: string;
  attributes: {
    key: string;
    value: string;
  }[];
}

export const flattenEventsInTransaction = (tx: Txn): TxnEvent[] => (tx.logs ?? []).flatMap((log) => log.events);

export const flattenEventsInBlock = (block: Block): TxnEvent[] =>
  block.transactions.flatMap(flattenEventsInTransaction);
