const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()

// createToken function 
exports.createToken = async ({name, symbol, totalSupply, decimals, owner, proposalTitle, proposalDesc, proposalStatus, votePowerLimit, periodId, logoURL, tokenomicsURL, mint}) => {

    const newToken = await prisma.token.create({
      data : {
        name : name,
        symbol : symbol,
        totalSupply : Number(totalSupply),
        decimals : Number(decimals),
        owner : owner,
        proposalTitle : proposalTitle,
        proposalDesc : proposalDesc,
        proposalStatus : proposalStatus,        
        periodId: Number(periodId),
        logoURL,
        tokenomicsURL,
        mint: mint
      }
    }).catch((e) => {
      console.error(e)
    })
    return newToken;
  }

exports.getUserTokens = async (userId) => {
    const tokens = await prisma.token.findMany();
    return tokens;
};
exports.getUserTokenbyID = async (tokenId) => {
  const tokens = await prisma.token.findUnique({
      where: {
          id: tokenId
      }
  });
  return tokens;
};
// updateToken function
exports.updateToken = async ({tokenId, periodId, proposalStatus}) => {
    const token = await prisma.token.update({
      where: {
        id: tokenId,
      },
      data: {
        periodId : periodId,
        proposalStatus: proposalStatus
      },
    }).catch((e) => {
      return e;
    })
    return token;
  }
// deleteToken function
exports.deleteToken = async (tokenId) => {
    const token = await prisma.token.delete({
      where: {
        id: tokenId,
      },
    })
  }