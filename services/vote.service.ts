import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateVoteArgs {
    votingUser: string;
    votePower: number;
    tokenId: string;
    txHash: string;
}

interface UpdateVoteArgs {
    voteId: number;
    votingUser: string;
    votePower: number;
    tokenId: string;
}

export const createVote = async ({ votingUser, votePower, tokenId, txHash }: CreateVoteArgs) => {
    try {
        const newVote = await prisma.vote.create({
            data: {
                votingUser,
                votePower,
                tokenId,
                txHash
            }
        });
        return newVote;
    } catch (error) {
        return error;
    }
}

export const getVote = async (voteId: number) => {
    try {
        const vote = await prisma.vote.findUnique({
            where: {
                id: voteId
            },
        });
        return vote;
    } catch (error) {
        return error;
    }
}

export const updateVote = async ({ voteId, votingUser, votePower, tokenId }: UpdateVoteArgs) => {
    try {
        const updatedVote = await prisma.vote.update({
            where: {
                id: voteId
            },
            data: {
                votingUser,
                votePower,
                tokenId
            }
        });
        return updatedVote;
    } catch (error) {
        return error;
    }
}

export const deleteVote = async (voteId: number) => {
    try {
        const deletedVote = await prisma.vote.delete({
            where: {
                id: voteId,
            },
        });
        return deletedVote;
    } catch (error) {
        return error;
    }
}