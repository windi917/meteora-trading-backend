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