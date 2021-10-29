import { Block } from './block';
import { log } from './logger';
import { TypedEmitter } from 'tiny-typed-emitter';
import { BlockDataSource } from './datasource';

export type SubscriberFn = (block: Block, subscriptionId: string) => Promise<void>;

interface HypeEvents {
  block: (block: Block) => void;
  postBlock: (block: Block) => void;
  callSubscriber: (subscriptionId: string, block: Block) => void;
  postCallSubscriber: (subscriptionId: string, block: Block) => void;
  error: (err: Error, subscriptionId: string, block: Block) => void;
}

export class Hype extends TypedEmitter<HypeEvents> {
  public subscriptions: { [id: string]: SubscriberFn } = {};

  constructor(public dataSource: BlockDataSource) {
    super();

    this.on('block', (block) => {
      log('block-poller', 'processing block', {
        height: block.height,
        blockTimestamp: block.timestamp.toISOString(),
      });
    });
  }

  subscribe(id: string, subscription: SubscriberFn): Hype {
    this.subscriptions[id] = subscription;
    return this;
  }

  unsubscribe(id: string) {
    if (!this.subscriptions[id]) {
      throw new Error(`subscription '${id}' is not found`);
    }
    delete this.subscriptions[id];
  }

  async start() {
    for await (const block of this.dataSource.blocks()) {
      this.emit('block', block);

      for (const [id, subscriber] of Object.entries(this.subscriptions)) {
        this.emit('callSubscriber', id, block);
        try {
          await subscriber(block, id);
        } catch (err) {
          this.emit('error', err as Error, id, block);
          continue;
        }
        this.emit('postCallSubscriber', id, block);
      }

      this.emit('postBlock', block);
    }
  }
}
