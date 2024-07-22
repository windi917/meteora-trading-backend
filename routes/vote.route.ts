import { PrismaClient } from '@prisma/client';
import express, { Request, Response, NextFunction } from 'express';
import { create, createNone } from '../controllers/vote.controller';

const prisma = new PrismaClient();
const router = express.Router();

interface AuthenticatedRequest extends Request {
  auth?: {
    walletaddress: string;
  };
}

const userCheck = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.auth) {
    return res.status(401).send('Invalid token, or no token supplied!');
  }

  // user check
  const user = await prisma.user.findUnique({
    where: {
      address: req.auth.walletaddress,
    },
  });

  if (!user) {
    return res.status(401).send('User is not registered!');
  }

  next();
};

router.post('/', userCheck, create);
router.post('/none', userCheck, createNone);

export default router;