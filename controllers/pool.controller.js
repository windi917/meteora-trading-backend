// const tokenService = require('../services/token.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
exports.create = async (req, res, next) => {
  try {
    const poolData = { 
        ...req.body,
        owner: req.auth.userId
    };

    const pool = await prisma.pool.create({
      data: poolData,
    });
    res.json(pool);
  } catch (error) {
    next(error);
  }
};
  
exports.getPools = async (req, res, next) => {
  try {
    const pools = await prisma.pool.findMany();
    res.json(pools);
  } catch (error) {
    next(error);
  }
};
