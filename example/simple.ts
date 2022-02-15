import { createRealtimeHype } from '../src';
import { extractEventsInBlock } from '../src/extensions/log-finder';
import { createCw20TransferLogFinder } from '../src/extensions/cw20';

const anchorTokenTransferFinder = createCw20TransferLogFinder('terra1747mad58h0w4y589y3sk84r5efqdev9q4r02pc');

async function main() {
  const hype = await createRealtimeHype();

  hype.subscribe('anc-token-transfers', async (block) => {
    extractEventsInBlock(block, [anchorTokenTransferFinder]).forEach(({ event: { from, to, amount }, txHash }) => {
      console.log(`Transferred ${amount} ANC: ${from} -> ${to}`);
      console.log(`  -> https://finder.terra.money/mainnet/tx/${txHash}`);
    });
  });
  await hype.start();
}

main()
  .then(() => process.exit())
  .catch((err) => {
    console.error(err.stack);
    process.exit(1);
  });
