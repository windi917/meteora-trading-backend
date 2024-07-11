const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()

exports.createVote = async ({votingUser, votePower, tokenId, txHash}) => {
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

exports.getVote = async (voteId) => {
  const vote = await prisma.vote.findUnique({
      where: {
          id: voteId
      },
  });
}


exports.updateVote = async ({voteId, votingUser, votePower, tokenId}) => {
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
}

exports.deleteVote = async (voteId) => {
  const deletedVote = await prisma.vote.delete({
      where: {
          id: voteId,
      },
  });
}
