import { Router } from 'express';
import { signIn, signUp } from './auth.controller.js';

export const authRouter = Router();

// Primary User/Admin Authentication Flows
authRouter.post('/signin', signIn);
authRouter.post('/login', signIn);

// Registration flows
authRouter.post('/signup', signUp);
authRouter.post('/register', signUp);

authRouter.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

import { protect } from './auth.middleware.js';

const currentUserHandler = [protect, (req: any, res: any) => {
  res.status(200).json({ 
    success: true, 
    user: {
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.firstName,
      role: req.user.role
    } 
  });
}];

authRouter.get('/me', ...currentUserHandler as any);
authRouter.get('/user', ...currentUserHandler as any);
authRouter.get('/current', ...currentUserHandler as any);
