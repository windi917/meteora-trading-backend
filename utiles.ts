import { Connection, Keypair } from "@solana/web3.js";
import dotenv from 'dotenv';
dotenv.config();

const adminSecretString = process.env.ADMIN_SECRET as string;
const adminSecretArray = adminSecretString.slice(1, -1).split(',');
const adminSecretNumbers = adminSecretArray.map(Number);

export const admin = Keypair.fromSecretKey(
    new Uint8Array(adminSecretNumbers)
);
console.log("##########", admin.publicKey.toBase58())

export const METEORA_API_URL = 'https://dlmm-api.meteora.ag'

const RPC = process.env.RPC as string;
console.log("RPC = ", RPC);
export const connection = new Connection(RPC, "finalized");