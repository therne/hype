import { Block, flattenEventsInBlock } from './block';
import { ReturningLogFinderMapper } from '@terra-money/log-finder';
import { defaultOptions, HypeOptions } from './options';
import { TypedEmitter } from 'tiny-typed-emitter';
import { BlockDataSource } from './datasource';

type ReturningLogFinderMapperBuilderFn<I> = (block: Block) => Promise<ReturningLogFinderMapper<I>[]>;

export interface Indexer<I, O> {
  id: string;
  logFinders: ReturningLogFinderMapper<I>[] | ReturningLogFinderMapperBuilderFn<I>;
  indexer: (input: I, block: Block) => Promise<O[]>;
  postIndexerHook?: (outputs: O[]) => Promise<void>;
}

interface HypeEvents {
  startBlockProcess: (block: Block) => void;
  endBlockProcess: (block: Block) => void;
  startIndexerRun: (indexerId: string, inputs: any[], block: Block) => void;
  endIndexerRun: (indexerId: string, outputs: any, block: Block) => void;
  error: (err: Error, indexer: Indexer<any, any>, block: Block) => void;
}

export class Hype extends TypedEmitter<HypeEvents> {
  public options: HypeOptions;
  public indexers: Indexer<any, any>[] = [];

  constructor(public dataSource: BlockDataSource, options: Partial<HypeOptions> = {}) {
    super();
    this.options = Object.assign(defaultOptions, options);

    this.on('startBlockProcess', (block) => {
      this.log('block-poller', 'processing block', {
        height: block.height,
        timestamp: block.timestamp.toISOString(),
      });
    });

    this.on('endIndexerRun', (indexerId, outputs, block) => {
      this.log(indexerId, 'completed', {
        outputCount: outputs.length,
        height: block.height,
      });
    });
  }

  subscribe(indexer: Indexer<any, any>) {
    this.indexers.push(indexer);
  }

  async start() {
    for await (const block of this.dataSource.blocks()) {
      this.emit('startBlockProcess', block);
      for (const indexerDefinition of this.indexers) {
        await this.runSingleIndexer(block, indexerDefinition);
      }
      this.emit('endBlockProcess', block);
    }
  }

  async runSingleIndexer<I, O>(
    block: Block,
    { id, logFinders: logFinderOrBuilder, indexer, postIndexerHook }: Indexer<I, O>,
  ) {
    const events = flattenEventsInBlock(block);
    const logFinders = logFinderOrBuilder instanceof Function ? await logFinderOrBuilder(block) : logFinderOrBuilder;

    const inputs: I[] = [];
    for (const event of events) {
      for (const logFinder of logFinders) {
        const results = logFinder(event);
        inputs.push(...results.flatMap(({ transformed }) => transformed ?? []));
      }
    }

    this.emit('startIndexerRun', id, inputs, block);
    const outputs: O[] = [];
    for (const input of inputs) {
      const output = await indexer(input, block);
      outputs.push(...output);
    }

    if (postIndexerHook) {
      await postIndexerHook(outputs);
    }
    this.emit('endIndexerRun', id, outputs, block);
  }

  private log(tag: string, msg: string, attr: { [k: string]: any }) {
    if (!this.options.logger) {
      return;
    }
    this.options.logger(tag, msg, attr);
  }
}
