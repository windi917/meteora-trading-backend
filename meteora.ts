import DLMM from "@meteora-ag/dlmm";
import { StrategyType, BinLiquidity, LbPosition } from "@meteora-ag/dlmm/dist";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SYSVAR_CLOCK_PUBKEY,
  ParsedAccountData,
} from "@solana/web3.js";
import base58 from "bs58";
import { BN } from "@coral-xyz/anchor";

const secret="37cNXXSnfWXXf8YAerPNpKJy5Le3PuVKRo4sJeUeeYNRbtr6y6gxks4uBMUAtgmHLJQ6ypz2UdMQkEMQCWna3WBq";
const decodedSecretKey = base58.decode(secret);
const user = Keypair.fromSecretKey(
  new Uint8Array(decodedSecretKey)
);

console.log("###############", decodedSecretKey, user.publicKey.toBase58())
const RPC = process.env.RPC || "https://api.mainnet-beta.solana.com";
const connection = new Connection(RPC, "finalized");

const SOL_USDC_POOL = new PublicKey(
  "FbkX1h2YTs171cEMa4GrV7XbAiQt5zSmV2CjfYWxXJDP"
);

let activeBin: BinLiquidity;
let userPositions: LbPosition[] = [];

const newPosition = new Keypair();

export async function getActiveBin(dlmmPool: DLMM) {
  // Get pool state
  activeBin = await dlmmPool.getActiveBin();
  console.log("🚀 ~ activeBin:", activeBin);
}

export async function getPositionsState(dlmmPool: DLMM) {
  // Get position state
  const positionsState = await dlmmPool.getPositionsByUserAndLbPair(
    user.publicKey
  );

  userPositions = positionsState.userPositions;
  console.log("🚀 ~ userPositions:", userPositions);
}

export async function createLiqudityPosition(dlmmPool: DLMM, strategy: string) {
  const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
  const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
  const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

  const activeBinPricePerToken = dlmmPool.fromPricePerLamport(
    Number(activeBin.price)
  );
  const totalXAmount = new BN(0);
  const totalYAmount = new BN(0);
  // const totalYAmount = totalXAmount.mul(new BN(Number(activeBinPricePerToken)));

  // Create Position (Spot Balance deposit, Please refer ``example.ts` for more example)
  const createPositionTx =
    await dlmmPool.initializePositionAndAddLiquidityByStrategy({
      positionPubKey: newPosition.publicKey,
      user: user.publicKey,
      totalXAmount,
      totalYAmount,
      strategy: {
        maxBinId,
        minBinId,
        strategyType: strategy === "SPOT" ? StrategyType.SpotBalanced : (strategy === "CURVE" ? StrategyType.CurveBalanced : StrategyType.BidAskBalanced),
      },
    });

  try {
    const createPositionTxHash = await sendAndConfirmTransaction(
      connection,
      createPositionTx,
      [user, newPosition]
    );
    console.log(
      "🚀 ~ createBalancePositionTxHash:",
      createPositionTxHash
    );
  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
  }
}

export async function addLiquidityToExistingPosition(dlmmPool: DLMM, strategy: string) {
  const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
  const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
  const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

  const activeBinPricePerToken = dlmmPool.fromPricePerLamport(
    Number(activeBin.price)
  );
  const totalXAmount = new BN(100);
  const totalYAmount = totalXAmount.mul(new BN(Number(activeBinPricePerToken)));

  // Add Liquidity to existing position
  const addLiquidityTx = await dlmmPool.addLiquidityByStrategy({
    positionPubKey: newPosition.publicKey,
    user: user.publicKey,
    totalXAmount,
    totalYAmount,
    strategy: {
      maxBinId,
      minBinId,
      strategyType: strategy === "SPOT" ? StrategyType.SpotBalanced : (strategy === "CURVE" ? StrategyType.CurveBalanced : StrategyType.BidAskBalanced),
    },
  });

  try {
    const addLiquidityTxHash = await sendAndConfirmTransaction(
      connection,
      addLiquidityTx,
      [user]
    );
    console.log("🚀 ~ addLiquidityTxHash:", addLiquidityTxHash);
  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
  }
}

export async function removePositionLiquidity(dlmmPool: DLMM) {
  // Remove Liquidity
  const removeLiquidityTxs = (
    await Promise.all(
      userPositions.map(({ publicKey, positionData }) => {
        const binIdsToRemove = positionData.positionBinData.map(
          (bin) => bin.binId
        );
        return dlmmPool.removeLiquidity({
          position: publicKey,
          user: user.publicKey,
          binIds: binIdsToRemove,
          bps: new BN(1), // 100% (range from 0 to 100)
          shouldClaimAndClose: true, // should claim swap fee and close position together
        });
      })
    )
  ).flat();

  try {
    for (let tx of removeLiquidityTxs) {
      const removeBalanceLiquidityTxHash = await sendAndConfirmTransaction(
        connection,
        tx,
        [user],
        { skipPreflight: false, preflightCommitment: "confirmed" }
      );
      console.log(
        "🚀 ~ removeBalanceLiquidityTxHash:",
        removeBalanceLiquidityTxHash
      );
    }
  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
  }
}

export async function swap(dlmmPool: DLMM) {
  const swapAmount = new BN(100);
  // Swap quote
  const swapYtoX = true;
  const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);
  const swapQuote = await dlmmPool.swapQuote(
    swapAmount,
    swapYtoX,
    new BN(10),
    binArrays
  );

  // Swap
  const swapTx = await dlmmPool.swap({
    inToken: dlmmPool.tokenX.publicKey,
    binArraysPubkey: swapQuote.binArraysPubkey,
    inAmount: swapAmount,
    lbPair: dlmmPool.pubkey,
    user: user.publicKey,
    minOutAmount: swapQuote.minOutAmount,
    outToken: dlmmPool.tokenY.publicKey,
  });

  try {
    const swapTxHash = await sendAndConfirmTransaction(connection, swapTx, [
      user,
    ]);
    console.log("🚀 ~ swapTxHash:", swapTxHash);
  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
  }
}

async function main() {
  const dlmmPool = await DLMM.create(connection, SOL_USDC_POOL);
  // , {
  //   cluster: "mainnet-beta",
  // }
  
  // console.log("DLMM : ", dlmmPool);
  if (!dlmmPool)
    return;
  
  await getActiveBin(dlmmPool);

  const activeBinPricePerToken = dlmmPool.fromPricePerLamport(
    Number(activeBin.price)
  );

  console.log("###########", activeBinPricePerToken);
  // await createLiqudityPosition(dlmmPool, "SPOT");
  await getPositionsState(dlmmPool);
  // await addLiquidityToExistingPosition(dlmmPool);
  // await removePositionLiquidity(dlmmPool);
  // await swap(dlmmPool);
}

main();