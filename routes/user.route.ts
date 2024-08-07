import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import express, { Request, Response, NextFunction } from 'express';
import { signup, login, deposit, withdraw, reduceDeposit, withdrawToUser } from '../controllers/user.controller';

const router: Router = Router();
const prisma = new PrismaClient();

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

router.post('/signup', signup);
router.post('/login', login);
router.post('/deposit', userCheck, deposit);
router.post('/withdraw', userCheck, withdraw);
router.post('/reduceDeposit', userCheck, reduceDeposit);
router.post('/withdrawToUser', userCheck, withdrawToUser);

export default router;
