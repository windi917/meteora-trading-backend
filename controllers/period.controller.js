// const tokenService = require('../services/token.service');
const { PrismaClient, ProposalStatus } = require('@prisma/client');

const prisma = new PrismaClient();
exports.create = async (req, res, next) => {
    try {
      const { projectId, startAt, endAt, votingtitle, votePowerLimit } = req.body;
      const votingPeriod = await prisma.votingPeriod.create({
        data: { startAt, endAt, votingtitle, votePowerLimit },
      });

      try {
        await prisma.token.update({
          where: { 
            id: Number(projectId)
          },
          data: {
            periodId: votingPeriod.id,
            proposalStatus: "VOTING"
          }
        });
      } catch (error) {
        next(error);
      }
      res.json(votingPeriod);
    } catch (error) {
      next(error);
    }
  };
  
  exports.getPeriods = async (req, res, next) => {
    try {
      const votingPeriods = await prisma.votingPeriod.findMany();
      res.json(votingPeriods);
    } catch (error) {
      next(error);
    }
  };
  
  exports.getPeriod =  async (req, res, next) => {
    try {
      const { id } = req.params;
      const votingPeriod = await prisma.votingPeriod.findUnique({
        where: { id: Number(id) },
      });
      if (votingPeriod === null) throw new Error('No such voting period found.');
      res.json(votingPeriod);
    } catch (error) {
      next(error);
    }
  };
  
  exports.update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { startAt, endAt, votingtitle, votePowerLimit } = req.body;
      const votingPeriod = await prisma.votingPeriod.update({
        where: { id: Number(id) },
        data: { startAt, endAt, votingtitle, votePowerLimit },
      });
      res.json(votingPeriod);
    } catch (error) {
      next(error);
    }
  };
  
  exports.delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const votingPeriod = await prisma.votingPeriod.delete({
        where: { id: Number(id) },
      });
      res.json(votingPeriod);
    } catch (error) {
      next(error);
    }
  };