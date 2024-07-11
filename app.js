const express = require('express');
const userRoutes = require('./routes/user.route');
const tokenRoutes = require('./routes/token.route');
const voteRoutes = require('./routes/vote.route');
const periodRoutes = require('./routes/period.route');
const vTokenRoutes = require('./routes/vtoken.route');
const poolTokenRoutes = require('./routes/pooltoken.route');
const poolRoutes = require('./routes/pool.route');
const marketRoutes = require('./routes/market.route');
const tokenPairRoutes = require('./routes/tokenpair.route');
const cors = require('cors');

const app = express();

const multer = require('multer');
const path = require('path');
const jwt = require("jsonwebtoken");
var { expressjwt: exjwt } = require("express-jwt");

app.use(cors());

// Setup middleware
const jwtCheck = exjwt({
    secret: process.env.JWT_SECRET, // Replace with your secret key
    algorithms: ['HS256'], // Ensure this matches your algorithm
    credentialsRequired: false // set credentialsRequired to false
  });
  
  app.use(jwtCheck);

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ storage: storage });

  app.post('/upload', upload.single('file'), (req, res) => {
    res.json({ file: req.file });
  });

  app.use('/uploads', express.static('uploads'));


app.get('/test', async(req, res) => {
  res.send("TEST")
})

app.use(express.json());
app.use('/user', userRoutes);
app.use('/token', tokenRoutes);
app.use('/vote', voteRoutes);
app.use('/period', periodRoutes);
app.use('/vtoken', vTokenRoutes);
app.use('/pooltoken', poolTokenRoutes);
app.use('/pool', poolRoutes);
app.use('/market', marketRoutes);
app.use('/tokenpair', tokenPairRoutes);

app.listen(4000, ()=>{
    console.log('Application running on http://localhost:4000');
});

module.exports = app;