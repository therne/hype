const globalFlushHandlers: (() => Promise<void>)[] = [];

export default class BufferedQueue<T> {
  queue: T[] = [];
  lastFlushedAt?: number;

  constructor(
    public readonly flushCallback: (items: T[]) => Promise<unknown>,
    public readonly flushIntervalInMs: number,
    public readonly maxItems: number,
  ) {
    globalFlushHandlers.push(() => this.flush());
  }

  static async flushAll(): Promise<void> {
    await Promise.all(globalFlushHandlers.map((handler) => handler()));
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
}
