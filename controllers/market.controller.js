// const tokenService = require('../services/token.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
exports.create = async (req, res, next) => {
  try {
    const marketData = { 
        ...req.body,
        owner: req.auth.userId
    };

    const market = await prisma.market.create({
      data: marketData,
    });
    res.json(market);
  } catch (error) {
    next(error);
  }
};
  
exports.getMarkets = async (req, res, next) => {
  try {
    const markets = await prisma.market.findMany();
    res.json(markets);
  } catch (error) {
    next(error);
  }
};
