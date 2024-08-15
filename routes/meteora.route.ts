import { PrismaClient } from '@prisma/client';
import express, { Request, Response, NextFunction } from 'express';
import { getPoolDepositRole, getPositions, getPoolPositions, getBinArraysApi, getBinIdByPriceApi, getPriceByBinIdApi, getActiveBinApi, getBalancesApi, addPositionApi, addLiquidityApi, removeLiquidityApi, closePositionApi, swapApi, claimApi, jupiterSwapApi, getUserDepositAmountApi, getUserPositionApi } from '../controllers/meteora.controller';

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

router.get('/userPosition', getUserPositionApi);
router.get('/userDepositAmount', getUserDepositAmountApi);
router.get('/poolRole', getPoolDepositRole);
router.get('/price', getPriceByBinIdApi);
router.get('/binId', getBinIdByPriceApi)
router.get('/activebin', getActiveBinApi);
router.get('/binArrays', getBinArraysApi);
router.get('/positions', getPositions);
router.get('/poolPositions', getPoolPositions);
router.get('/balances', getBalancesApi);
router.post('/position/add', userCheck, addPositionApi);
router.post('/position/close', userCheck, closePositionApi);
router.post('/liquidity/add', userCheck, addLiquidityApi);
router.post('/liquidity/remove', userCheck, removeLiquidityApi);
router.post('/swap', userCheck, swapApi);
router.post('/claim', userCheck, claimApi);
router.post('/jupiterswap', userCheck, jupiterSwapApi);

export default router;