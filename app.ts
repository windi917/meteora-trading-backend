import express, { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { expressjwt as exjwt } from 'express-jwt';
import userRoutes from './routes/user.route';
import meteoraRoutes from './routes/meteora.route';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());

// Setup middleware
const jwtCheck = exjwt({
  secret: process.env.JWT_SECRET || 'your-default-secret', // Replace with your secret key
  algorithms: ['HS256'], // Ensure this matches your algorithm
  credentialsRequired: false // set credentialsRequired to false
});

app.use(jwtCheck);

app.get('/test', async (req: Request, res: Response) => {
  res.send("TEST");
});

app.use(express.json());
app.use('/user', userRoutes);
app.use('/meteora', meteoraRoutes);

app.listen(3900, () => {
  console.log('Application running on http://localhost:3900');
});

export default app;