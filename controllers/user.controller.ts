import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createUser, getUserByAddress, userDeposit, userDepositReduce, userWithdraw } from '../services/user.service';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

import {
  PublicKey,
  Keypair,
  Connection,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
  mintTo,
} from "@solana/spl-token";
import base58 from 'bs58';
import dotenv from 'dotenv';
import { admin, connection } from "../utiles";

dotenv.config();

const sleep = (time: number) => {
  return new Promise(resolve => setTimeout(resolve, time))
}

interface SignupRequest extends Request {
  body: {
    address: string;
    msg: string;
    signature: string;
  };
}

interface LoginRequest extends Request {
  body: {
    address: string;
  };
}

interface MeteoraRequest extends Request {
  auth?: any
}

export const signup = async (req: SignupRequest, res: Response, next: NextFunction) => {
  const { address, msg, signature } = req.body;
  try {
    // Validate whether the address of owner signed the "msg" to signature.
    // Decode base58 to a buffer
    const bytes = bs58.decode(address);
    const buffer = Buffer.from(signature, 'base64');

    const publicKeyUintArray = Uint8Array.from(bytes);
    const signatureUintArray = Uint8Array.from(buffer);
    const messageUintArray = new Uint8Array(Buffer.from(msg));
    const valid = nacl.sign.detached.verify(messageUintArray, signatureUintArray, publicKeyUintArray);

    if (!valid) {
      return res.status(402).json({ "message": 'The Signed Message Not Valid' });
    }

    const user = await createUser({
      address: address,
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(402).json(error);
  }
}

export const login = async (req: LoginRequest, res: Response, next: NextFunction) => {
  try {
    console.log(req.body);
    const { address } = req.body;

    let user = await getUserByAddress(address);
    if (!user) {
      return res.json({ success: false });
    }

    const token = jwt.sign(
      { userId: user.id, walletaddress: user.address },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    const admin = JSON.parse(process.env.ADMIN_WALLET as string) as string[];
    let flag = admin.includes(user.address);

    // const role = flag ? "ADMIN" : "USER";
    const role = "ADMIN";
    console.log("ROLE: ADMIN");

    res.json({ success: true, token, userId: user.id, address: user.address, role });
  } catch (error) {
    next(error);
  }
}

export const deposit = async (req: Request, res: Response, next: NextFunction) => {
  const { user, amount, depositType, txHash } = req.body;

  try {
    let startTime = Math.floor(new Date().getTime() / 1000);

    let txHash = req.body.txHash;
    let txsInfo = await connection.getTransaction(txHash, { commitment: 'confirmed' });

    do {
      if (!txsInfo) {
        console.log("fetching tx info...")
        await sleep(5000);
        txsInfo = await connection.getTransaction(txHash, { commitment: 'confirmed' });
        let endTime = Math.floor(new Date().getTime() / 1000);
        if (endTime - startTime > 60) {
          console.log("timeout!")
          break;
        }
      } else {
        break;
      }
    } while (true);

    const result = txsInfo;

    if (result === null || result === undefined)
      return res.status(402).json({ "Error": "Transaction error" });

    console.log("TX-----: ", result);

    const deposit = await userDeposit(user, amount, depositType);

    console.log("deposit-----: ", deposit);
    res.status(200).json(deposit);
  } catch (error) {
    res.status(402).json(error);
  }
};

export const withdraw = async (req: MeteoraRequest, res: Response, next: NextFunction) => {
  const { pool, reduceAmount, withdrawType } = req.body;

  try {
    const response = await userWithdraw(req.auth.userId, pool, reduceAmount, withdrawType);

    res.status(200).json(response);
  } catch (error) {
    res.status(402).json(error);
  }
};

export const reduceDeposit = async (req: MeteoraRequest, res: Response, next: NextFunction) => {
  const { amount, withdrawType } = req.body;
  console.log("########", req.auth.userId, amount);

  try {
    const response = await userDepositReduce(req.auth.userId, amount, withdrawType);

    res.status(200).json(response);
  } catch (error) {
    res.status(402).json(error);
  }
};

export const withdrawToUser = async (req: MeteoraRequest, res: Response, next: NextFunction) => {
  const { amount, withdrawType } = req.body;
  console.log("########", req.auth.walletaddress, amount, withdrawType);

  const SOL_MINT = 'So11111111111111111111111111111111111111112';
  const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

  const SOL_DECIMALS = 9;
  const USDC_DECIMALS = 6;

  try {
    const tokenMintAddress = withdrawType === 1 ? SOL_MINT : USDC_MINT;
    const decimals = withdrawType === 1 ? SOL_DECIMALS : USDC_DECIMALS;

    console.log("---here0-----", tokenMintAddress, decimals)
    const mintToken = new PublicKey(tokenMintAddress);
    console.log("############", req.auth.walletaddress)
    const recipientAddress = new PublicKey(req.auth.walletaddress);

    console.log("---here0-:1----", mintToken, recipientAddress)

    let transaction = new Transaction();
    transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000, }))

    if (withdrawType === 1) {
      try {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: recipientAddress,
            lamports: amount * (10 ** decimals),
          })
        );
      } catch (error) {
        console.log(`Deposit Error! ${error}`);
        return res.status(200).json({success: false, error: error});
      }
    } else {
      try {
        const transactionInstructions: TransactionInstruction[] = [];
        console.log("-##########--------");
        const associatedTokenFrom = await getAssociatedTokenAddress(
          mintToken,
          admin.publicKey
        );
        console.log("here1--", associatedTokenFrom)
        const fromAccount = await getAccount(connection, associatedTokenFrom);
        console.log("here2--", fromAccount)
        const associatedTokenTo = await getAssociatedTokenAddress(
          mintToken,
          recipientAddress
        );
        console.log("here3--", associatedTokenTo)
        if (!(await connection.getAccountInfo(associatedTokenTo))) {
          transactionInstructions.push(
            createAssociatedTokenAccountInstruction(
              admin.publicKey,
              associatedTokenTo,
              recipientAddress,
              mintToken
            )
          );
        }
        transactionInstructions.push(
          createTransferInstruction(
            fromAccount.address, // source
            associatedTokenTo, // dest
            admin.publicKey,
            amount * (10 ** decimals)
          )
        );
        transaction.add(...transactionInstructions);

        
        console.log("here3--", transaction)
      } catch (error) {
        console.log(`Deposit Error! ${error}`);
        return res.status(200).json({success: false, error: error});
      }
    }

    console.log("here4------");
    // Send and confirm the transaction
    const blockHash = await connection.getLatestBlockhash();
    console.log("here5------", blockHash);
    transaction.feePayer = admin.publicKey;
    transaction.recentBlockhash = blockHash.blockhash;
    console.log("here6------", transaction);
    transaction.sign(admin);
    console.log("here7------", transaction);
    const signature = await connection.sendRawTransaction(
      transaction.serialize(), { skipPreflight: true }
    );

    console.log("---------withdraw transaction hash-", signature);
    const response = await connection.confirmTransaction(
      {
        blockhash: blockHash.blockhash,
        lastValidBlockHeight: blockHash.lastValidBlockHeight,
        signature: signature,
      },
      "finalized"
    );

    console.log("##########$$$$$$$$$$", response, response.value.err);
    if ( response.value.err ) {
      return res.status(200).json({success: false, error: response.value.err});
    }

    const txHash = (await signature).toString();

    console.log("Withdraw Success!: ", txHash);
    return res.status(200).json({success: true});
  } catch (error) {
    console.log("Withdraw error!", error);
    res.status(402).json(error);
  }
};