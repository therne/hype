import { Block, flattenEventsInBlock } from '../../block';
import { ReturningLogFinderMapper } from '@terra-money/log-finder';

export function findAndParseEvents<T>(block: Block, logFinders: ReturningLogFinderMapper<T>[]): T[] {
  return flattenEventsInBlock(block)
    .map((event) => logFinders.map((fn) => fn(event)))
    .flat() // LogFinderResult<T>[][]
    .flat() // LogFinderResult<T>[]
    .flatMap(({ transformed }) => transformed ?? []);
}
