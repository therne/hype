import { Block, flattenEventsInTransaction } from '../../block';
import { ReturningLogFinderMapper } from '@terra-money/log-finder';

export interface ExtractedEvent<T> {
  txHash: string;
  event: T;
}

export const extractEventsInBlock = <T>(block: Block, logFinders: ReturningLogFinderMapper<T>[]): ExtractedEvent<T>[] =>
  block.transactions
    .map((tx) => ({ txHash: tx.txhash, events: flattenEventsInTransaction(tx) }))
    .map(({ txHash, events }) =>
      events
        .map((event) => logFinders.map((fn) => fn(event)))
        .flat()
        .flat()
        .flatMap(({ transformed: event }) => (event != null ? [{ txHash, event }] : [])),
    )
    .flat();
