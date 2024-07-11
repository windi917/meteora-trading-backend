const express = require('express');
const router = express.Router();
const tokenpairController = require('../controllers/tokenpair.controller');

// User-specific middleware
const userCheck = (req, res, next) => {
  if (!req.auth) return res.status(401).send('Invalid token, or no token supplied!');
  // Check whatever you want here. For example:

  const admin = JSON.parse(process.env.ADMIN_WALLET);
  let flag = false;
  for (let i = 0; i < admin.length; i++)
    if (admin[i] === req.auth.walletaddress) {
      flag = true;
      break;
    }
  if ( flag === false ) return res.status(401).send('This token does not have the admin role!');
  next();
};

router.post('/', tokenpairController.create);
router.get('/', tokenpairController.getTokenPairs);
router.get('/period/:id', tokenpairController.getTokenPairsByPeriodID);
router.get('/:id', tokenpairController.getTokenPair);
router.put('/:id', tokenpairController.update);
router.delete('/:id', tokenpairController.delete);
router.delete('/period/:id', tokenpairController.deleteByPeriodId);



module.exports = router;