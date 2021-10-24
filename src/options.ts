import { pino } from 'pino';

export interface HypeOptions {
  logger?: (tag: string, msg: string, attr: { [k: string]: any }) => void;
}

const defaultLogger = pino({
  level: 'trace',
  base: undefined, // Set to undefined to avoid adding pid, hostname properties to each log.
});

export const defaultOptions: HypeOptions = {
  logger: (tag, msg, attr) => defaultLogger.trace({ tag, ...attr }, msg),
};
