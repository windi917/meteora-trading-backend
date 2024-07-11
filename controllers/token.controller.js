const tokenService = require('../services/token.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
exports.create = async (req, res, next) => {
    try {
        if(!req.auth){
            return res.status(402).json({"Error":"Invalid Auth"});
        }
        const tokenData = { 
            ...req.body,
            logoURL: "https://api.prnthub.com/" + req.files.logoURL[0].path,
            tokenomicsURL: "https://api.prnthub.com/" + req.files.tokenomicsURL[0].path,
            owner: req.auth.userId
        };
        const token = await tokenService.createToken(tokenData);
        res.status(201).json(token)
    } catch (error) {
        res.status(402).json(error);
    }
}

exports.getUserTokens = async (req, res, next) => {
    try {
        const tokens = await tokenService.getUserTokens();
        res.json(tokens);
    } catch (error) {
        next(error);
    }
}
exports.getApprovedTokens = async (req, res, next) => {
    try {
        const tokens = await prisma.token.findMany({
            where: { proposalStatus: "APPROVED"},
        });
        res.json(tokens);
    } catch (error) {
        next(error);
    }
}
exports.getByPeriodId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tokens = await prisma.token.findMany({
            where: { periodId: Number(id)},
        });
        res.json(tokens);
    } catch (error) {
        next(error);
    }
}
exports.approveToken = async (req, res, next) => {
    try {
        const token = await prisma.token.update(
            {
                where: {
                    id: req.body.tokenId,
                    },
                    data: {
                        proposalStatus: "APPROVED"
                    },
            }
        ).catch((e) => {
            res.status(402).json({"Error":"Not Found"});
            return;
          });
        res.json(token);
    } catch (error) {
        next(error);
    }
}

exports.setTokenStatue = async (req, res, next) => {
    try {
        const token = await prisma.token.update(
            {
                where: {
                    id: req.body.tokenId
                },
                data: {
                    proposalStatus: req.body.status
                },
            }
        ).catch((e) => {
            res.status(402).json({"Error":"Not Found"});
            return;
          });
        res.json(token);
    } catch (error) {
        next(error);
    }
}

exports.setTokenMint = async (req, res, next) => {
    try {
        const token = await prisma.token.update(
            {
                where: {
                    id: req.body.tokenId
                },
                data: {
                    mint: req.body.mint,
                    proposalStatus: 'LAUNCHED'
                },
            }
        ).catch((e) => {
            res.status(402).json({"Error":"Not Found"});
            return;
          });
        res.json(token);
    } catch (error) {
        next(error);
    }
}

exports.registerToken = async (req, res, next) => {
    if(!req.auth){
        return res.status(402).json({"Error":"Invalid Auth"});
    }
    const tokenData = { 
        ...req.body,        
        proposalStatus: "VOTING"
    };
    try {
        let token = await tokenService.getUserTokenbyID(req.body.tokenId);
        if(token.owner != req.auth.userId)
            return res.status(402).json({"Error":"Incorrect Token Owner"});
        if(token.proposalStatus != "PENDING")
            return res.status(402).json({"Error":"Already Registered"});
        const new_token = await tokenService.updateToken(tokenData);
        res.status(201).json(new_token);
    } catch (error) {
        res.status(402).json(error);
    }
}