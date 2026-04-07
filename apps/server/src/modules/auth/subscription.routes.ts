import { Router } from 'express';
import { protect } from '../auth/auth.middleware.js';
import { User } from '../auth/auth.model.js';

export const subscriptionRouter = Router();

// Cancel subscription
subscriptionRouter.post('/subscription/cancel', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.subscriptionStatus = 'cancelled';
    await user.save();

    res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ success: false, message: 'Server error cancelling subscription' });
  }
});

// Extend Trial 30 days
subscriptionRouter.post('/subscription/extend-trial', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Extend trial end date by 30 days
    const now = new Date();
    user.trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    user.subscriptionStatus = 'trial';
    await user.save();

    res.json({ success: true, message: 'Trial extended successfully' });
  } catch (error) {
    console.error('Error extending trial:', error);
    res.status(500).json({ success: false, message: 'Server error extending trial' });
  }
});

// Payment History Mock
subscriptionRouter.get('/payments/history', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    // We mock payment history for now, unless planType is trial or free
    if (!user || user.planType === 'trial' || !user.planType) {
      return res.json([]);
    }

    const history = [
      {
        id: 'inv_123',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        amount: user.planType === 'professional' ? 29.00 : (user.planType === 'enterprise' ? 49.00 : 15.00),
        status: 'completed',
        method: 'Visa ending in 4242',
        invoice: 'INV-2026-001'
      }
    ];

    res.json(history);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
