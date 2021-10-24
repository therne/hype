Hype
======

An experimental indexer framework. Allows subscribing on-chain events from Terra Blockchain.

## Architecture Overview

![Hype Diagram](./docs/Hype-Diagram.png);

## Example

```ts
const datasource = new BlockPoller(
  new HiveBlockFetcher('https://hive.terra.dev/graphql'),
  new DynamoDBLastSyncedHeightRepository(),
);
const hype = new Hype(datasource);

hype.register({
  id: 'cw20-transfer',
  logFinders: [
    createReturningLogFinderRule(
      {
        type: 'from_contract',
        attributes: [
          ['contract_address'],
          ['action', 'transfer'],
          ['from'],
          ['to'],
          ['amount'],
        ],
      },
      (_, match) => ({
        token: match[0].value,
        from: match[2].value,
        to: match[3].value,
        amount: match[4].value,
      }),
    ),
  ],
  async indexer({ token ,from, to, amount }): Promise<Cw20TransferModel[]> {
    return [new CW20TransferModel({ token ,from, to, amount })];
  },
  async postIndexerHook(outputs: Cw20TransferModel[], block: Block)  {
    myMagicDB.save(...outputs);
    console.log(`caught ${outputs.length} transfers on block #${block.height}`);
  },
});

hype.start();

```
