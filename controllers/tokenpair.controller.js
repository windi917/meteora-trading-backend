// const tokenService = require('../services/token.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
exports.create = async (req, res, next) => {
    try {
      const { periodId, voteTokenId, weight, minimumCount } = req.body;
      const tokenpair = await prisma.voteTokenPair.create({
        data: { periodId, voteTokenId, weight, minimumCount } ,
      });
      res.json(tokenpair);
    } catch (error) {
      next(error);
    }
  };
  
  exports.getTokenPairs = async (req, res, next) => {
    try {
      const tokenpairs = await prisma.voteTokenPair.findMany();
      res.json(tokenpairs);
    } catch (error) {
      next(error);
    }
  };
  exports.getTokenPairsByPeriodID = async (req, res, next) => {
    try {
      const { id } = req.params;
      const tokenpairs = await prisma.voteTokenPair.findMany({
        where: { periodId: Number(id)},
      });
      res.json(tokenpairs);
    } catch (error) {
      next(error);
    }
  };
  
  exports.getTokenPair =  async (req, res, next) => {
    try {
      const { id } = req.params;
      const tokenpair = await prisma.voteTokenPair.findUnique({
        where: { id: Number(id) },
      });
      if (tokenpair === null) throw new Error('No such voting period found.');
      res.json(tokenpair);
    } catch (error) {
      next(error);
    }
  };
  
  exports.update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { periodId, voteTokenId, weight }  = req.body;
      const tokenpair = await prisma.voteTokenPair.update({
        where: { id: Number(id) },
        data: { periodId, voteTokenId, weight } ,
      });
      res.json(tokenpair);
    } catch (error) {
      next(error);
    }
  };
  
  exports.delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const tokenpair = await prisma.voteTokenPair.delete({
        where: { id: Number(id) },
      });
      res.json(tokenpair);
    } catch (error) {
      next(error);
    }
  };
  exports.deleteByPeriodId = async (req, res, next) => {
    try {
      const { id } = req.params;
      const tokenpair = await prisma.voteTokenPair.deleteMany({
        where: { periodId: Number(id) },
      });
      res.json(tokenpair);
    } catch (error) {
      next(error);
    }
  };