import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { getActiveBin, getPositionsState, getBalance, createLiqudityPosition, addLiquidityToExistingPosition, removePositionLiquidity, closePosition, swap, getPriceByBinId, getBinIdByPrice, claimFee, getBinArrays, jupiterSwap, getPair, getTokenPrice, getDecimals } from '../meteora';

const prisma = new PrismaClient();

interface SuccessResult {
  positionSol: number;
  positionUSDC: number;
  positionUserSol: number;
  positionUserUSDC: number;
  userAmount?: number; // Optional, if it might not always be present
  poolAddress: string;
  sol_usdc: number;
  totalAmount: number | null;
}

interface MeteoraRequest extends Request {
  auth?: any
}

export const getUserPositionApi = async (req: MeteoraRequest, res: Response, next: NextFunction) => {
  try {
    const userDeposit = await prisma.userDeposit.findFirst({
      where: {
        user: req.auth.userId,
      }
    })
    if (!userDeposit)
      return res.status(200).send({ sol: 0, usdc: 0 });

    // Step 1: Get the total amount for each pool grouped by sol_usdc
    const totalAmountPerPoolBySolUsdc = await prisma.poolUser.groupBy({
      by: ['pool', 'sol_usdc'],
      _sum: {
        amount: true,
      },
    });
    if (!totalAmountPerPoolBySolUsdc)
      return res.status(200).send({ sol: 0, usdc: 0 });

    // Step 2: Get the total amount for the specified user within each pool grouped by sol_usdc
    const userAmountsBySolUsdc = await prisma.poolUser.groupBy({
      by: ['pool', 'sol_usdc'],
      where: {
        user: req.auth.userId,
      },
      _sum: {
        amount: true,
      },
    });
    if (!userAmountsBySolUsdc)
      return res.status(200).send({ sol: 0, usdc: 0 });

    // Step 3: Combine the data
    const total_userDepositPerPool = totalAmountPerPoolBySolUsdc.map(pool => {
      const userAmount = userAmountsBySolUsdc.find(
        userPool => userPool.pool === pool.pool && userPool.sol_usdc === pool.sol_usdc
      );
      return {
        poolAddress: pool.pool,
        sol_usdc: pool.sol_usdc,
        totalAmount: pool._sum.amount ?? 0,
        userAmount: userAmount ? userAmount._sum.amount ?? 0 : 0,
      };
    });
    if (!total_userDepositPerPool)
      return res.status(200).send({ sol: 0, usdc: 0 });

    const positionUserData = total_userDepositPerPool.map(async (e) => {
      const pairRes = await getPair(e.poolAddress);
      const posRes = await getPositionsState(e.poolAddress);
      if (pairRes.success === false || posRes.success === false || !posRes.userPositions)
        return { success: false };

      const priceRes = await getTokenPrice(['SOL', pairRes.response.mint_x, pairRes.response.mint_y]);
      const xDecimals = await getDecimals(pairRes.response.mint_x);
      const yDecimals = await getDecimals(pairRes.response.mint_y);

      if (priceRes.success === false || xDecimals.success === false || yDecimals.success === false)
        return { success: false }
      if (!priceRes.response.data['SOL'] || !priceRes.response.data[pairRes.response.mint_x] || !priceRes.response.data[pairRes.response.mint_y])
        return { success: false }

      // console.log("---------", pairRes, posRes.userPositions[0].positionData.totalXAmount, posRes.userPositions[0].positionData.totalYAmount, priceRes.response.data['SOL'], priceRes.response.data[pairRes.response.mint_x], priceRes.response.data[pairRes.response.mint_y], xDecimals, yDecimals)

      if (!posRes.userPositions.length) {
        const rate = (e.userAmount === 0) ? 0 : e.totalAmount / e.userAmount;

        return {
          ...e,
          positionSol: 0,
          positionUSDC: 0,
          positionUserSol: 0,
          positionUserUSDC: 0,
        } as SuccessResult
      } else {
        const positionXUSDC = (parseInt(posRes.userPositions[0].positionData.totalXAmount) / (10 ** xDecimals.decimals)) * priceRes.response.data[pairRes.response.mint_x].price;
        const positionYUSDC = (parseInt(posRes.userPositions[0].positionData.totalYAmount) / (10 ** xDecimals.decimals)) * priceRes.response.data[pairRes.response.mint_y].price;
        const positionXSol = positionXUSDC / priceRes.response.data['SOL'].price;
        const positionYSol = positionYUSDC / priceRes.response.data['SOL'].price;
        const positionUSDC = positionXUSDC + positionYUSDC;
        const positionSol = positionXSol + positionYSol;

        const rate = (e.userAmount === 0) ? 0 : e.totalAmount / e.userAmount;

        return {
          ...e,
          positionSol: positionXSol + positionYSol,
          positionUSDC: positionXUSDC + positionYUSDC,
          positionUserSol: positionSol / rate,
          positionUserUSDC: positionUSDC / rate,
        } as SuccessResult
      }
    })

    try {
      // Wait for all promises to resolve
      const results = await Promise.all(positionUserData);
      // Calculate sums
      const totalSum = results.reduce((acc, curr) => {
        if ('success' in curr && !curr.success) return acc;

        // If the current result is a SuccessResult
        const successResult = curr as SuccessResult;

        // Update the appropriate sum based on sol_usdc value
        if (successResult.sol_usdc === 1) {
          acc.sumSol.totalAmount += successResult.totalAmount || 0;
          acc.sumSol.userAmount += successResult.userAmount || 0;
          acc.sumSol.positionSol += successResult.positionSol || 0;
          acc.sumSol.positionUSDC = 0;
          acc.sumSol.positionUserSol += successResult.positionUserSol || 0;
          acc.sumSol.positionUserUSDC = 0;
        } else if (successResult.sol_usdc === 2) {
          acc.sumUsdc.totalAmount += successResult.totalAmount || 0;
          acc.sumUsdc.userAmount += successResult.userAmount || 0;
          acc.sumUsdc.positionSol = 0;
          acc.sumUsdc.positionUSDC += successResult.positionUSDC || 0;
          acc.sumUsdc.positionUserSol = 0;
          acc.sumUsdc.positionUserUSDC += successResult.positionUserUSDC || 0;
        }

        return acc;
      }, {
        sumSol: { totalAmount: 0, userAmount: 0, positionSol: 0, positionUSDC: 0, positionUserSol: 0, positionUserUSDC: 0 },
        sumUsdc: { totalAmount: 0, userAmount: 0, positionSol: 0, positionUSDC: 0, positionUserSol: 0, positionUserUSDC: 0 }
      });

      return res.status(200).json({ pools: results, ...totalSum, userDeposit });
    } catch (error) {
      console.error("An error occurred:", error);
      return { success: false }
    }
  } catch (error) {
    // Handle the error here, for example:
    next(error);
  }
}

export const getUserDepositAmountApi = async (req: Request, res: Response, next: NextFunction) => {
  console.log("GET User Deposit Amount: ");

  try {
    const totalDeposits = await prisma.userDeposit.aggregate({
      _sum: {
        solAmount: true,
        usdcAmount: true,
      },
    });

    const { _sum: { solAmount, usdcAmount } } = totalDeposits;
    const totalSolAmount = solAmount || 0;
    const totalUsdcAmount = usdcAmount || 0;

    res.status(200).send({ sol: totalSolAmount, usdc: totalUsdcAmount });
  } catch (error) {
    // Handle the error here, for example:
    next(error);
  }
}

export const getPoolDepositRole = async (req: Request, res: Response, next: NextFunction) => {
  console.log("GET Pool Role: ", req.query.pool);

  if (typeof req.query.pool === 'string') {
    try {
      // add to database
      const position = await prisma.position.findFirst({
        where: {
          pool: req.query.pool,
        },
      });

      res.status(200).send(position);
    } catch (error) {
      // Handle the error here, for example:
      next(error);
    }
  } else {
    res.status(400).send({ error: 'Invalid pool query parameter' });
  }
}

export const getPriceByBinIdApi = async (req: Request, res: Response, next: NextFunction) => {
  console.log("GET Price: ", req.query.pool, Number(req.query.binId));

  if (typeof req.query.pool === 'string') {
    try {
      const response = await getPriceByBinId(req.query.pool, Number(req.query.binId));
      res.status(200).send(response);
    } catch (error) {
      // Handle the error here, for example:
      next(error);
    }
  } else {
    res.status(400).send({ error: 'Invalid pool query parameter' });
  }
}

export const getBinIdByPriceApi = async (req: Request, res: Response, next: NextFunction) => {
  console.log("GET BinID: ", req.query.pool, Number(req.query.price));

  if (typeof req.query.pool === 'string') {
    try {
      const response = await getBinIdByPrice(req.query.pool, Number(req.query.price));
      res.status(200).send(response);
    } catch (error) {
      // Handle the error here, for example:
      next(error);
    }
  } else {
    res.status(400).send({ error: 'Invalid pool query parameter' });
  }
}

export const getActiveBinApi = async (req: Request, res: Response, next: NextFunction) => {
  console.log("GET Active Bin: ", req.query.pool);

  if (typeof req.query.pool === 'string') {
    try {
      const response = await getActiveBin(req.query.pool);
      res.status(200).send(response);
    } catch (error) {
      // Handle the error here, for example:
      next(error);
    }
  } else {
    res.status(400).send({ error: 'Invalid pool query parameter' });
  }
}

export const getBinArraysApi = async (req: Request, res: Response, next: NextFunction) => {
  console.log("GET Bin Arrays: ", req.query.pool);

  if (typeof req.query.pool === 'string') {
    const minBinId = parseInt(req.query.minBinId as string, 10);
    const maxBinId = parseInt(req.query.maxBinId as string, 10);

    console.log("------Min, Max--", minBinId, maxBinId);
    if (isNaN(minBinId) || isNaN(maxBinId)) {
      return res.status(400).send({ error: 'Invalid minBinId or maxBinId query parameter' });
    }

    try {
      const response = await getBinArrays(req.query.pool, minBinId, maxBinId);
      res.status(200).send(response);
    } catch (error) {
      next(error); // Forward error to the error handling middleware
    }
  } else {
    res.status(400).send({ error: 'Invalid pool query parameter' });
  }
};

export const getPoolPositions = async (req: Request, res: Response, next: NextFunction) => {
  console.log("GET Pool POSITION");

  try {
    const positions = await prisma.position.findMany();
    res.status(200).send(positions);
  } catch (error) {
    next(error);
  }
}

export const getPositions = async (req: Request, res: Response, next: NextFunction) => {
  console.log("GET POSITION: ", req.query.pool);

  if (typeof req.query.pool === 'string') {
    try {
      const response = await getPositionsState(req.query.pool);
      res.status(200).send(response);
    } catch (error) {
      // Handle the error here, for example:
      next(error);
    }
  } else {
    res.status(400).send({ error: 'Invalid pool query parameter' });
  }
}

export const getBalancesApi = async (req: Request, res: Response, next: NextFunction) => {
  if (typeof req.query.mint === 'string') {
    try {
      const response = await getBalance(req.query.mint);
      res.status(200).send(response);
    } catch (error) {
      // Handle the error here, for example:
      next(error);
    }
  } else {
    res.status(400).send({ error: 'Invalid pool query parameter' });
  }
}

export const addPositionApi = async (req: Request, res: Response, next: NextFunction) => {
  const param = req.body;
  console.log("Add Position: ", param);

  try {
    const response = await createLiqudityPosition(param.pool, param.strategy, param.xAmount, param.yAmount, param.minBinId, param.maxBinId);
    console.log("Add Position Res = ", response)
    res.status(200).send(response);
  } catch (error) {
    res.status(402).json(error);
  }
}

export const closePositionApi = async (req: Request, res: Response, next: NextFunction) => {
  const param = req.body;
  console.log("Close Position: ", param);

  try {
    const response = await closePosition(param.pool, param.position);
    console.log("Close Position Res = ", response)
    res.status(200).send(response);
  } catch (error) {
    res.status(402).json(error);
  }
}

export const addLiquidityApi = async (req: MeteoraRequest, res: Response, next: NextFunction) => {
  const param = req.body;
  console.log("Add Liquidity: ", req.auth, param);

  try {
    const response = await addLiquidityToExistingPosition(param.pool, param.position, param.strategy, param.xAmount, param.yAmount, param.minBinId, param.maxBinId, param.depositToken, param.depositAmount);
    console.log("Add Liquidity Res = ", response)
    res.status(200).send(response);
  } catch (error) {
    res.status(402).json(error);
  }
}

export const removeLiquidityApi = async (req: Request, res: Response, next: NextFunction) => {
  const param = req.body;
  console.log("Remove Liquidity: ", param);

  try {
    const response = await removePositionLiquidity(param.pool, param.position, param.bps, param.shouldClaimAndClose, param.swapTo);
    console.log("Remove Liquidity Res = ", response)
    res.status(200).send(response);
  } catch (error) {
    res.status(402).json(error);
  }
}

export const swapApi = async (req: Request, res: Response, next: NextFunction) => {
  const param = req.body;
  console.log("Swap: ", param);

  try {
    const response = await swap(param.pool, param.amount, param.swapXtoY);
    console.log("Swap Res = ", response)
    res.status(200).send(response);
  } catch (error) {
    res.status(402).json(error);
  }
}

export const claimApi = async (req: Request, res: Response, next: NextFunction) => {
  const param = req.body;
  console.log("Claim: ", param);

  try {
    const response = await claimFee(param.pool, param.position);
    console.log("Claim Res = ", response)
    res.status(200).send(response);
  } catch (error) {
    res.status(402).json(error);
  }
}

export const jupiterSwapApi = async (req: MeteoraRequest, res: Response, next: NextFunction) => {
  const param = req.body;
  console.log("Jupiter Swap: ", param);

  try {
    const response = await jupiterSwap(param.input, param.output, param.amount);
    console.log("Jupiter Swap Res = ", response)
    res.status(200).send(response);
  } catch (error) {
    res.status(402).json(error);
  }
}