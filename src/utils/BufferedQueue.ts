import { log } from '../logger';

export default class BufferedQueue<T> {
  queue: T[] = [];
  lastFlushedAt?: number;

  constructor(
    public flushCallback: (items: T[]) => Promise<unknown>,
    public flushIntervalInMs: number,
    public maxItems: number,
  ) {
    ['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach((signal) => process.on(signal, () => this.exit(signal)));
  }

  async push(items: T[]) {
    this.queue.push(...items);

    if (this.flushIntervalIsOver() || this.isFull()) {
      await this.flush();
    }
  }

  private flushIntervalIsOver = () => {
    if (!this.lastFlushedAt) {
      this.lastFlushedAt = Date.now();
    }
    return Date.now() - this.lastFlushedAt >= this.flushIntervalInMs;
  };

  private isFull = () => {
    return this.queue.length === this.maxItems;
  };

  private async flush() {
    await this.flushCallback(this.queue);
    this.queue = [];
    this.lastFlushedAt = Date.now();
  }

  private async exit(signal: string) {
    log('info', 'BufferedQueue', 'received', {
      signal,
      itemsRemaining: this.queue.length,
    });
    if (this.queue.length) await this.flush();
    process.exit(0);
  }
}
