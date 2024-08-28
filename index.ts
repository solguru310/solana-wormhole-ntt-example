import {
    TransactionId,
    Wormhole,
    amount,
    signSendWait,
  } from "@wormhole-foundation/sdk";
  import evm from "@wormhole-foundation/sdk/platforms/evm";
  import solana from "@wormhole-foundation/sdk/platforms/solana";
  
  // register protocol implementations
  import "@wormhole-foundation/sdk-evm-ntt";
  import "@wormhole-foundation/sdk-solana-ntt";
import { TEST_NTT_TOKENS } from "./const";
import { getSigner } from "./helpers";
    

  (async function () {
    const wh = new Wormhole("Testnet", [solana.Platform, evm.Platform]);
    const src = wh.getChain("BaseSepolia");
    const dst = wh.getChain("Solana");

    const srcSigner = await getSigner(src);
    const dstSigner = await getSigner(dst);
  
    const srcNtt = await src.getProtocol("Ntt", {
      ntt: TEST_NTT_TOKENS[src.chain],
    });
    const dstNtt = await dst.getProtocol("Ntt", {
      ntt: TEST_NTT_TOKENS[dst.chain],
    });
  
    const amt = amount.units(
      amount.parse("0.01", await srcNtt.getTokenDecimals())
    );
  
    const xfer = () =>
      srcNtt.transfer(srcSigner.address.address, amt, dstSigner.address, {
        queue: false,
        automatic: false,
        gasDropoff: 0n,
      });
  
    // Initiate the transfer (or set to recoverTxids to complete transfer)
    const txids: TransactionId[] = await signSendWait(src, xfer(), srcSigner.signer);
    console.log("Source txs", txids);
  
    const vaa = await wh.getVaa(
      txids[txids.length - 1]!.txid,
      "Ntt:WormholeTransfer",
      25 * 60 * 1000
    );
    console.log(vaa);
  
    const dstTxids = await signSendWait(
      dst,
      dstNtt.redeem([vaa!], dstSigner.address.address),
      dstSigner.signer
    );
    console.log("dstTxids", dstTxids);
  })();