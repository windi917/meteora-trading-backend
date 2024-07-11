const express = require('express');
const router = express.Router();
const periodController = require('../controllers/period.controller');

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

router.post('/', userCheck, periodController.create);
router.get('/', periodController.getPeriods);
router.get('/:id', periodController.getPeriod);
router.put('/:id', userCheck, periodController.update);
router.delete('/:id', userCheck, periodController.delete);



module.exports = router;