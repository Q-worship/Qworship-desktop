import { Router } from 'express';
import { signIn, signUp, updateProfile, updatePassword } from './auth.controller.js';

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

const currentUserHandler = [protect, async (req: any, res: any) => {
  try {
    const { Organization } = await import('../organization/organization.model.js');
    const organizations = await Organization.find({ ownerId: req.user._id });
    
    res.status(200).json({ 
      success: true, 
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        username: req.user.username,
        accountType: req.user.accountType,
        phoneNumber: req.user.phoneNumber,
        bio: req.user.bio,
        profilePicture: req.user.profilePicture,
        planType: req.user.planType,
        trialStartDate: req.user.trialStartDate,
        trialEndDate: req.user.trialEndDate,
        subscriptionStatus: req.user.subscriptionStatus,
        createdAt: req.user.createdAt
      },
      organizations: organizations.map(org => ({ id: org._id, name: org.name }))
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user' });
  }
}];

authRouter.get('/me', ...currentUserHandler as any);
authRouter.get('/user', ...currentUserHandler as any);
authRouter.get('/current', ...currentUserHandler as any);

const protectMiddlewares = [protect] as any;
authRouter.put('/profile', ...protectMiddlewares, updateProfile as any);
authRouter.put('/update-password', ...protectMiddlewares, updatePassword as any);
