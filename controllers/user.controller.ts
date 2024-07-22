import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createUser, getUserByAddress} from '../services/user.service';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

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

    const role = flag ? "ADMIN" : "USER";

    res.json({ success: true, token, userId: user.id, address: user.address, role });
  } catch (error) {
    next(error);
  }
}