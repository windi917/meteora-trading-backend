const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();
const voteController = require('../controllers/vote.controller');

const userCheck = async (req, res, next) => {
    if (!req.auth) return res.status(401).send('Invalid token, or no token supplied!');
    // Check whatever you want here. For example:
  
    // user check
    const user = await prisma.user.findUnique({
      where: {
        address: req.auth.walletaddress
      },
      include: {
        tokens: true,
        votes: true
      }
    });

    if (!user)
      return res.status(401).send('User is not registered!');
  
    next();
  };

router.post('/', userCheck, voteController.create);
router.post('/none', userCheck, voteController.createNone);

module.exports = router;