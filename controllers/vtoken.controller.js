// const tokenService = require('../services/token.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
exports.create = async (req, res, next) => {
  try {
    const { name, tokenMint, decimals } = req.body;
    const vtoken = await prisma.voteToken.create({
      data: { name, tokenMint, decimals },
    });
    res.json(vtoken);
  } catch (error) {
    next(error);
  }
};
  
exports.getVTokens = async (req, res, next) => {
  try {
    const vtokens = await prisma.voteToken.findMany();
    res.json(vtokens);
  } catch (error) {
    next(error);
  }
};

exports.getVToken =  async (req, res, next) => {
  try {
    const { id } = req.params;
    const vtoken = await prisma.voteToken.findUnique({
      where: { id: Number(id) },
    });
    if (vtoken === null) throw new Error('No such voting period found.');
    res.json(vtoken);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, tokenMint, decimals } = req.body;
    const vtoken = await prisma.voteToken.update({
      where: { id: Number(id) },
      data: { name, tokenMint, decimals },
    });
    res.json(vtoken);
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vtoken = await prisma.voteToken.delete({
      where: { id: Number(id) },
    });
    res.json(vtoken);
  } catch (error) {
    next(error);
  }
};