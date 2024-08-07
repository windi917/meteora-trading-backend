import DLMM from "@meteora-ag/dlmm";
import { StrategyType } from "@meteora-ag/dlmm/dist";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
  VersionedTransaction,
  TransactionMessage,
  TransactionInstruction,
  AddressLookupTableAccount,
} from "@solana/web3.js";

import {
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import base58 from "bs58";
import BN from "bn.js";
import { PrismaClient } from '@prisma/client';
import axios from "axios";
import { updatePoolDeposit, updateUserPoolDeposit } from "./services/meteora.service";
import dotenv from 'dotenv';
import { admin, connection, METEORA_API_URL } from "./utiles";

dotenv.config();

const prisma = new PrismaClient();

export async function getDecimals(mintAddress: string) {
  try {
    const tokenMintAddress = new PublicKey(mintAddress);
    const account = await connection.getParsedAccountInfo(tokenMintAddress);
    const parsedInfo = (account.value?.data as any)?.parsed?.info;

    if (parsedInfo) {
      return { success: true, decimals: parsedInfo.decimals };
    } else {
      console.log("Not a valid SPL token mint");
      return { success: false };
    }
  } catch (err) {
    console.log("Not a valid SPL token mint", err);
    return { success: false };
  }
}

export const getTokenPrice = async (symbols: string[]) => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://price.jup.ag/v6/price?ids=${symbols.join(',')}`,
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
}

export const getPair = async (pool: string) => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: METEORA_API_URL + `/pair/${pool}`,
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.request(config);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false };
  }
};

const getAdressLookupTableAccounts = async (
  keys: string[]
): Promise<AddressLookupTableAccount[]> => {
  const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(keys.map((key) => new PublicKey(key)));

  return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
    const addressLookupTableAddress = keys[index];
    if (accountInfo) {
      const addressLookupTableAccount = new AddressLookupTableAccount({
        key: new PublicKey(addressLookupTableAddress),
        state: AddressLookupTableAccount.deserialize(accountInfo.data),
      });
      acc.push(addressLookupTableAccount);
    }

    return acc;
  }, new Array<AddressLookupTableAccount>());
};

export const getSwapInx = async (quoteResponse: any) => {
  const instructions = await (
    await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // quoteResponse from /quote api
        quoteResponse: {
          ...quoteResponse,
          // contextSlot: slot
        },
        userPublicKey: admin.publicKey.toString(),
        wrapAndUnwrapSol: true,
        computeUnitPriceMicroLamports: 'auto'
      })
    })
  ).json();
  // console.log(" swap instruction ", instructions)
  const {
    swapInstruction: swapInstructionPayload, // The actual swap instruction.
    addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
  } = instructions;

  const swapInstruction = new TransactionInstruction({
    programId: new PublicKey(swapInstructionPayload.programId),
    keys: swapInstructionPayload.accounts.map((key: any) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(swapInstructionPayload.data, "base64"),
  });

  // console.log("##########", swapInstruction, addressLookupTableAddresses);
  return {
    swapInstruction,
    addressLookupTableAddresses
  }
}

export const jupiterSwap = async (input: string, output: string, amount: number) => {
  console.log("Swap Step0: ", input, output, amount);
  try {
    const quoteResponse = await (
      await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${input}&outputMint=${output}&amount=${amount}&slippageBps=200`)
    ).json();

    console.log("Swap Step1: ", quoteResponse);
    if (!quoteResponse)
      return { success: false }

    let addressLookupTableAccounts: AddressLookupTableAccount[] = [];
    let addressLookupTableAddresses: string[] = [];

    const {
      swapInstruction,
      addressLookupTableAddresses: addressLookupTableAddressesPayload,
    } = await getSwapInx(quoteResponse)

    addressLookupTableAddressesPayload.map((addressLookupTableAddressePayload: any) => {
      if (!addressLookupTableAddresses.includes(addressLookupTableAddressePayload)) addressLookupTableAddresses.push(addressLookupTableAddressePayload)
    })

    console.log("Swap Step2: ");

    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 2000000
    })
    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 200000
    })

    let inxs: TransactionInstruction[] = [];
    inxs.push(swapInstruction);

    // using all of the api returned LUT accounts
    addressLookupTableAccounts.push(
      ...(await getAdressLookupTableAccounts(addressLookupTableAddresses))
    );

    const blockhash = await connection.getLatestBlockhash();
    const messageV0_new = new TransactionMessage({
      payerKey: admin.publicKey,
      recentBlockhash: blockhash.blockhash,

      instructions: [modifyComputeUnits, addPriorityFee, ...inxs],
      // 
    }).compileToV0Message(addressLookupTableAccounts);

    const transaction = new VersionedTransaction(messageV0_new);

    // sign the transaction
    transaction.sign([admin]);

    console.log("Swap Step3: ", transaction)
    if (!transaction)
      return { success: false }

    //////// send and confirm transaction
    // get the latest block hash
    const latestBlockHash = await connection.getLatestBlockhash();

    // Execute the transaction
    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, { skipPreflight: true });
    const txHash = await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: txid
    }, 'finalized');

    console.log("------taHash: ---", txHash)
    if ( !txHash || txHash.value.err )
      return { success: false }

    console.log(`https://solscan.io/tx/${txid}`);

    return { success: true, outAmount: quoteResponse.outAmount }
  } catch (error) {
    console.log("Jupiter Swap Error: ", error);
    return { success: false }
  }
}

export async function getBalance(tokenMint: string) {
  const publicKey = admin.publicKey;
  if (!publicKey) {
    throw { success: false };
  }

  if (tokenMint === 'So11111111111111111111111111111111111111112') {
    const solBalance = await connection.getBalance(publicKey);
    return { success: true, balance: solBalance / (10 ** 9) };
  }

  const mintToken = new PublicKey(tokenMint);
  const tokenAccount = await getAssociatedTokenAddress(mintToken, publicKey);
  const info = await connection.getTokenAccountBalance(tokenAccount);
  if (info.value.uiAmount == null)
    return { success: false };

  return { success: true, balance: info.value.uiAmount };
}

export async function getBinIdByPrice(pool: string, price: number) {
  const dlmmPool = await DLMM.create(connection, new PublicKey(pool));
  if (!dlmmPool)
    return { success: false };

  const binId = await dlmmPool.getBinIdFromPrice(price, false);
  // console.log("🚀 ~ Bin ID:", price, binId);

  return { success: true, binId: binId }
}

export async function getPriceByBinId(pool: string, binId: number) {
  const dlmmPool = await DLMM.create(connection, new PublicKey(pool));
  if (!dlmmPool)
    return { success: false };

  const price = await dlmmPool.getPriceOfBinByBinId(binId);
  // console.log("🚀 ~ Bin Price:", binId, price);

  return { success: true, price: price }
}

export async function getActiveBin(pool: string) {
  const dlmmPool = await DLMM.create(connection, new PublicKey(pool));
  if (!dlmmPool)
    return { success: false };

  // Get pool state
  const activeBin = await dlmmPool.getActiveBin();
  // console.log("🚀 ~ activeBin:", activeBin);

  return { success: true, activeBin: activeBin }
}

export async function getBinArrays(pool: string, minBinId: number, maxBinId: number) {
  const dlmmPool = await DLMM.create(connection, new PublicKey(pool));
  if (!dlmmPool)
    return { success: false };

  // Get pool state
  const binArrays = await dlmmPool.getBinsBetweenLowerAndUpperBound(minBinId, maxBinId)
  // console.log("🚀 ~ Bin Arrays:", binArrays);

  return { success: true, binArrays: binArrays }
}

export async function getPositionsState(pool: string) {
  const dlmmPool = await DLMM.create(connection, new PublicKey(pool));
  if (!dlmmPool)
    return { success: false };

  // Get position state
  const positionsState = await dlmmPool.getPositionsByUserAndLbPair(
    admin.publicKey
  );

  const userPositions = positionsState.userPositions;

  // console.log("🚀 ~ userPositions:", userPositions);
  return { success: true, userPositions: userPositions }
}

export async function createLiqudityPosition(pool: string, strategy: string, xAmount: number, yAmount: number, minBinId: number, maxBinId: number) {
  const dlmmPool = await DLMM.create(connection, new PublicKey(pool));
  if (!dlmmPool)
    return { success: false };

  const totalXAmount = new BN(0);
  const totalYAmount = new BN(0);

  const newPosition = new Keypair();

  const createPositionTx =
    await dlmmPool.initializePositionAndAddLiquidityByStrategy({
      positionPubKey: newPosition.publicKey,
      user: admin.publicKey,
      totalXAmount,
      totalYAmount,
      strategy: {
        maxBinId,
        minBinId,
        strategyType: strategy === "SPOT" ? StrategyType.SpotBalanced : (strategy === "CURVE" ? StrategyType.CurveBalanced : StrategyType.BidAskBalanced),
      },
      slippage: 2,
    });

  try {
    createPositionTx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000, }))

    const createPositionTxHash = await sendAndConfirmTransaction(
      connection,
      createPositionTx,
      [admin, newPosition]
    );

    console.log(
      "🚀 ~ createBalancePositionTxHash:",
      createPositionTxHash
    );

    // add to database
    await prisma.position.create({
      data: {
        pool: pool,
        position: newPosition.publicKey.toBase58(),
        sol_usdc: 0,
        amount: 0
      },
    });

    return { success: true, tx: createPositionTxHash };
  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
    return { success: false }
  }
}

export async function addLiquidityToExistingPosition(pool: string, positionKey: string, strategy: string, xAmount: number, yAmount: number, minBinId: number, maxBinId: number, depositToken: string, depositAmount: number) {
  console.log("#######", pool, positionKey, strategy, xAmount, yAmount, depositToken, depositAmount);

  const dlmmPool = await DLMM.create(connection, new PublicKey(pool));
  if (!dlmmPool)
    return { success: false };

  const totalXAmount = new BN(xAmount);
  const totalYAmount = new BN(yAmount);

  // Add Liquidity to existing position
  const addLiquidityTx = await dlmmPool.addLiquidityByStrategy({
    positionPubKey: new PublicKey(positionKey),
    user: admin.publicKey,
    totalXAmount,
    totalYAmount,
    strategy: {
      maxBinId,
      minBinId,
      strategyType: strategy === "SPOT" ? StrategyType.SpotImBalanced : (strategy === "CURVE" ? StrategyType.CurveBalanced : StrategyType.BidAskBalanced),
    },
    slippage: 3,
  });

  try {
    addLiquidityTx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000, }))

    const addLiquidityTxHash = await sendAndConfirmTransaction(
      connection,
      addLiquidityTx,
      [admin]
    );
    console.log("🚀 ~ addLiquidityTxHash:", addLiquidityTxHash);

    let sol_usdc = 0;
    if (depositToken === 'SOL') sol_usdc = 1;
    if (depositToken === 'USDC') sol_usdc = 2;

    //////////////////////////// add to database
    // pool-position deposit
    console.log("here1");
    const updatePoolDepositRes = await updatePoolDeposit(pool, positionKey, sol_usdc, depositAmount);
    if (!updatePoolDepositRes.success)
      return { success: false };
    console.log("here2");
    // user-deposit 
    if (sol_usdc === 0)
      return { success: true };

    const updateUserPoolDepositRes = await updateUserPoolDeposit(pool, sol_usdc, depositAmount);
    if (!updateUserPoolDepositRes.success)
      return { success: false }

    console.log("here3");
    return { success: true, tx: addLiquidityTxHash };
  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
    return { success: false }
  }
}

export async function removePositionLiquidity(pool: string, positionKey: string, bps: number, shouldClaimAndClose: boolean, swapTo: string) {
  const dlmmPool = await DLMM.create(connection, new PublicKey(pool));
  if (!dlmmPool)
    return { success: false };

  
  const posRes = await getPositionsState(pool);
  if (posRes.success === false)
    return { success: false };

  const userPositions = posRes.userPositions;
  if (userPositions === null || userPositions === undefined)
    return { success: false };

  // Remove Liquidity
  let swapXAmount = 0;
  let swapYAmount = 0;
  const removeLiquidityTxs = await Promise.all(
    userPositions
      .filter((position) => position.publicKey.toBase58() === positionKey)
      .map(async (position) => {
        const binIdsToRemove = position.positionData.positionBinData.map((bin) => bin.binId);

        swapXAmount = parseInt(position.positionData.totalXAmount) * bps / 100;
        swapYAmount = parseInt(position.positionData.totalYAmount) * bps / 100;

        return dlmmPool.removeLiquidity({
          position: new PublicKey(positionKey),
          user: admin.publicKey,
          binIds: binIdsToRemove,
          bps: new BN(bps * 100), // 100% (range from 0 to 100)
          shouldClaimAndClose: shouldClaimAndClose, // should claim swap fee and close position together
        });
      })
  );

  console.log("#############", swapXAmount, swapYAmount, dlmmPool.lbPair.tokenXMint.toBase58(), dlmmPool.lbPair.tokenYMint.toBase58());
  const flattenedRemoveLiquidityTxs = removeLiquidityTxs.flat();

  try {
    for (let tx of flattenedRemoveLiquidityTxs) {

      tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000, }))
      // Add this line if you are on producton or mainnet or your tx will fail.
      const claimFeeTxHash = await sendAndConfirmTransaction(
        connection,
        tx,
        [admin],
        { skipPreflight: false, preflightCommitment: "confirmed" }
      );

      if ( swapTo === 'sol' ) {
        if ( swapXAmount !== 0 )
          await jupiterSwap(dlmmPool.lbPair.tokenXMint.toBase58(), 'So11111111111111111111111111111111111111112', Math.floor(swapXAmount));
        if ( swapYAmount !== 0 )
          await jupiterSwap(dlmmPool.lbPair.tokenYMint.toBase58(), 'So11111111111111111111111111111111111111112', Math.floor(swapYAmount));
      } else {
        if ( swapXAmount !== 0 )
          await jupiterSwap(dlmmPool.lbPair.tokenXMint.toBase58(), 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', Math.floor(swapXAmount));
        if ( swapYAmount !== 0 )
          await jupiterSwap(dlmmPool.lbPair.tokenYMint.toBase58(), 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', Math.floor(swapYAmount));
      }
      console.log(
        "🚀 ~ claimFeeTxHash:",
        claimFeeTxHash
      );
    }

    if (shouldClaimAndClose) {
      await prisma.position.delete({
        where: {
          pool_position: { // Use composite unique key
            pool,
            position: positionKey
          }
        }
      });
    }

    return { success: true };
  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
    return { success: false }
  }
}

export async function closePosition(pool: string, positionKey: string) {
  const dlmmPool = await DLMM.create(connection, new PublicKey(pool));
  if (!dlmmPool)
    return { success: false };

  const posRes = await getPositionsState(pool);
  if (posRes.success === false)
    return { success: false };

  const userPositions = posRes.userPositions;
  if (userPositions === null || userPositions === undefined)
    return { success: false };

  const position = userPositions.find(e => e.publicKey.toBase58() === positionKey);
  if (!position)
    return { success: false };

  let closePositionTx = await dlmmPool.closePosition({
    owner: admin.publicKey,
    position: position,
  });

  try {
    closePositionTx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000, }))
    // Add this line if you are on producton or mainnet or your tx will fail.
    const removeBalanceLiquidityTxHash = await sendAndConfirmTransaction(
      connection,
      closePositionTx,
      [admin],
    );
    console.log(
      "🚀 ~ closePositionTxHash:",
      removeBalanceLiquidityTxHash
    );

    await prisma.position.delete({
      where: {
        pool_position: { // Use composite unique key
          pool,
          position: positionKey
        }
      }
    });

    return { success: true, tx: removeBalanceLiquidityTxHash };
  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
    return { success: false }
  }
}

export async function claimFee(pool: string, positionKey: string) {
  const dlmmPool = await DLMM.create(connection, new PublicKey(pool));
  if (!dlmmPool)
    return { success: false };

  const posRes = await getPositionsState(pool);
  if (posRes.success === false)
    return { success: false };

  const userPositions = posRes.userPositions;
  if (userPositions === null || userPositions === undefined)
    return { success: false };

  const position = userPositions.find(e => e.publicKey.toBase58() === positionKey);
  if (!position)
    return { success: false };

  let claimFeeTxs = await dlmmPool.claimAllRewardsByPosition({
    owner: admin.publicKey,
    position: position,
  });

  try {
    for (let tx of claimFeeTxs) {
      tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000, }))
      // Add this line if you are on producton or mainnet or your tx will fail.
      const claimFeeTxHash = await sendAndConfirmTransaction(
        connection,
        tx,
        [admin],
      );
      console.log(
        "🚀 ~ claimFeeTxHash:",
        tx
      );

      return { success: true, tx: tx };
    }

  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
    return { success: false }
  }
}

export async function swap(pool: string, amount: number, swapXtoY: boolean) {
  const dlmmPool = await DLMM.create(connection, new PublicKey(pool));
  if (!dlmmPool)
    return { success: false };

  const swapAmount = new BN(amount);
  // Swap quote
  const binArrays = await dlmmPool.getBinArrayForSwap(swapXtoY);
  const swapQuote = await dlmmPool.swapQuote(
    swapAmount,
    swapXtoY,
    new BN(3),
    binArrays
  );

  console.log("############", swapQuote);
  // Swap
  let swapTx;

  if (swapXtoY === true) {
    swapTx = await dlmmPool.swap({
      inToken: dlmmPool.tokenX.publicKey,
      binArraysPubkey: swapQuote.binArraysPubkey,
      inAmount: swapAmount,
      lbPair: dlmmPool.pubkey,
      user: admin.publicKey,
      minOutAmount: swapQuote.minOutAmount,
      outToken: dlmmPool.tokenY.publicKey,
    });
  } else {
    swapTx = await dlmmPool.swap({
      inToken: dlmmPool.tokenY.publicKey,
      binArraysPubkey: swapQuote.binArraysPubkey,
      inAmount: swapAmount,
      lbPair: dlmmPool.pubkey,
      user: admin.publicKey,
      minOutAmount: swapQuote.minOutAmount,
      outToken: dlmmPool.tokenX.publicKey,
    });
  }


  console.log("-----------", swapTx)
  try {
    swapTx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000, }))
    const swapTxHash = await sendAndConfirmTransaction(connection, swapTx, [
      admin,
    ]);
    console.log("🚀 ~ swapTxHash:", swapTxHash);
    return { success: true, tx: swapTxHash };
  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
    return { success: false }
  }
}
