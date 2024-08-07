import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const updateUserPoolDeposit = async (pool: string, sol_usdc: number, depositAmount: number) => {
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

    if ((sol_usdc === 1 && totalSolAmount < depositAmount) ||
      (sol_usdc === 2 && totalUsdcAmount < depositAmount))
      return { success: false }

    const rate = sol_usdc === 1 ? totalSolAmount / depositAmount : totalUsdcAmount / depositAmount;

    // Step 3: Fetch all users' deposits
    const userDeposits = await prisma.userDeposit.findMany();

    for (const userDeposit of userDeposits) {
      // Determine if we are working with solAmount or usdcAmount
      const depositField = sol_usdc === 1 ? 'solAmount' : 'usdcAmount';

      // Step 5: Decrease the specific solAmount or usdcAmount
      await prisma.userDeposit.update({
        where: {
          id: userDeposit.id,
        },
        data: {
          [depositField]: userDeposit[depositField] - userDeposit[depositField] / rate,
        },
      });

      // Step 6: Update or create the PoolUser record
      await prisma.poolUser.upsert({
        where: {
          user_pool: {
            user: userDeposit.user,
            pool: pool,
          },
        },
        update: {
          amount: {
            increment: userDeposit[depositField] / rate,
          },
        },
        create: {
          user: userDeposit.user,
          pool: pool,
          sol_usdc: sol_usdc,
          amount: userDeposit[depositField] / rate,
        },
      });
    }

    return { success: true }
  } catch (e) {
    return { success: false }
  }

}

export const updatePoolDeposit = async (pool: string, positionKey: string, sol_usdc: number, depositAmount: number) => {
  try {
    await prisma.position.updateMany({
      where: {
        pool: pool
      },
      data: {
        sol_usdc: sol_usdc,
      },
    })

    const positionOne = await prisma.position.findFirst({
      where: {
        pool: pool,
        position: positionKey
      }
    })

    if (!positionOne)
      return { success: false }

    await prisma.position.update({
      where: {
        pool_position: {
          pool: pool,
          position: positionKey
        }
      },
      data: {
        amount: positionOne.amount + depositAmount,
      },
    })

    return { success: true }
  } catch (e) {
    return { success: false }
  }
}
