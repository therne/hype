import { pino } from 'pino';

export type Logger = (tag: string, msg: string, attr: { [k: string]: any }) => void;

const defaultLogger = pino({
  level: 'trace',
  base: undefined, // Set to undefined to avoid adding pid, hostname properties to each log.
});

export let log: Logger = (tag, msg, attr) => defaultLogger.trace({ tag, ...attr }, msg);

/**
 * Overrides Hype's logger. If it's called with no arguments or nullish values, it mutes logs from Hype.
 * @param newLogger A new {@code Logger}
 */
export function setHypeLogger(newLogger?: Logger) {
  if (!newLogger) {
    // mute logging
    log = () => {};
    return;
  }
  log = newLogger;
}
