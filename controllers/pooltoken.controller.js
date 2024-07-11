// const tokenService = require('../services/token.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
exports.create = async (req, res, next) => {
  try {
    const { name, tokenMint, decimals } = req.body;
    const pooltoken = await prisma.poolToken.create({
      data: { name, tokenMint, decimals },
    });
    res.json(pooltoken);
  } catch (error) {
    next(error);
  }
};
  
exports.getPoolTokens = async (req, res, next) => {
  try {
    const pooltokens = await prisma.poolToken.findMany();
    res.json(pooltokens);
  } catch (error) {
    next(error);
  }
};
