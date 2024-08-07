import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

// createUser function
export const createUser = async ({ address }: { address: string }): Promise<User | null> => {
  try {
    const newUser = await prisma.user.create({
      data: {
        address: address,
      }
    });
    return newUser;
  } catch (e) {
    console.error(e);
    return null;
  }
}

// getUser function
export const getUser = async (userId: number): Promise<User | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    return user;
  } catch (e) {
    console.error(e);
    return null;
  }
}

// deleteUser function
export const deleteUser = async (userId: number): Promise<User | null> => {
  try {
    const user = await prisma.user.delete({
      where: {
        id: userId,
      },
    });
    return user;
  } catch (e) {
    console.error(e);
    return null;
  }
}

// getUserByAddress function
export const getUserByAddress = async (address: string): Promise<User | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        address: address
      },
    });
    return user;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export const userDeposit = async (user: number, amount: number, depositType: number) => {
  try {
    // Determine if depositType corresponds to solAmount or usdcAmount
    const depositField = depositType === 1 ? 'solAmount' : 'usdcAmount';

    // Check if a deposit already exists for the user and deposit type
    const existingDeposit = await prisma.userDeposit.findFirst({
      where: {
        user: user,
      }
    });

    if (existingDeposit) {
      // If a deposit exists, update the amount
      const updatedDeposit = await prisma.userDeposit.update({
        where: {
          id: existingDeposit.id
        },
        data: {
          [depositField]: existingDeposit[depositField] + amount
        }
      });
      return updatedDeposit;
    } else {
      // If no deposit exists, create a new one
      const newDeposit = await prisma.userDeposit.create({
        data: {
          user: user,
          solAmount: depositType === 1 ? amount : 0,
          usdcAmount: depositType === 2 ? amount : 0,
        }
      });
      return newDeposit;
    }
  } catch (e) {
    console.error(e);
    return null;
  }
}


export const userWithdraw = async (user: number, pool: string, reduceAmount: number, withdrawType: number) => {
  try {
    // Fetch the PoolUser record
    const poolUser = await prisma.poolUser.findFirst({
      where: {
        user: user,
        pool: pool,
        sol_usdc: withdrawType,
      },
    });

    if (!poolUser) {
      throw new Error(`PoolUser with user ${user}, pool ${pool}, and sol_usdc ${withdrawType} not found.`);
    }

    const newAmount = poolUser.amount - reduceAmount;
    // Update PoolUser amount
    await prisma.poolUser.update({
      where: {
        id: poolUser.id,
      },
      data: {
        amount: newAmount,
      },
    });

  } catch (e) {
    console.error(e);
    return null;
  }
}

export const userDepositReduce = async (user: number, reduceAmount: number, withdrawType: number) => {
  try {
    const userDeposit = await prisma.userDeposit.findFirst({
      where: {
        user: user,
      },
    });

    if (!userDeposit)
      return null;

    if ( withdrawType === 1 ) {
      const newAmount = userDeposit.solAmount - reduceAmount;
      await prisma.userDeposit.update({
        where: {
          id: userDeposit.id,
        },
        data: {
          solAmount: newAmount,
        },
      });
    } else {
      const newAmount = userDeposit.usdcAmount - reduceAmount;
      await prisma.userDeposit.update({
        where: {
          id: userDeposit.id,
        },
        data: {
          usdcAmount: newAmount,
        },
      });
    }
  } catch (e) {
    console.error(e);
    return null;
  }
}
