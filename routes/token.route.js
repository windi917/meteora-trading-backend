const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/token.controller');
//const authMiddleware = require('../middlewares/auth'); //assuming you have an auth middleware
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const cpUpload = upload.fields([{ name: 'logoURL', maxCount: 1 }, { name: 'tokenomicsURL', maxCount: 1 }])

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


router.post('/', userCheck, cpUpload, tokenController.create);
router.get('/', tokenController.getUserTokens);
router.get('/period/:id', tokenController.getByPeriodId);
router.get('/approve', tokenController.getApprovedTokens);
router.post('/register', userCheck, tokenController.registerToken);
router.post('/approve', userCheck, tokenController.approveToken);
router.post('/status', userCheck, tokenController.setTokenStatue);
router.post('/mint', userCheck, tokenController.setTokenMint);


module.exports = router;