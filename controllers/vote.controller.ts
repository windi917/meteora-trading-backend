import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { Connection, clusterApiUrl } from '@solana/web3.js';

interface AuthRequest extends Request {
  auth?: {
    walletaddress: string;
    userId: string;
  };
}

interface VoteBody {
  txHash: string;
  tokenId: string;
  votePower: number;
}

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.auth) {
    return res.status(402).json({ "Error": "Invalid Auth" });
  }
}

export const createNone = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.auth) {
    return res.status(402).json({ "Error": "Invalid Auth" });
  }
}