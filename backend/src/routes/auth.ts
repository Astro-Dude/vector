import express, { Request, Response } from 'express';
import passport from 'passport';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Purchase from '../models/Purchase.js';

const router = express.Router();

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.NODE_ENV === 'production' ? '/login' : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login` }),
  (req, res) => {
    // Successful authentication, redirect to dashboard
    const redirectUrl = process.env.NODE_ENV === 'production' ? '/home' : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/home`;
    res.redirect(redirectUrl);
  }
);

// Check authentication status
router.get('/status', (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: (req.user as any)._id,
        email: (req.user as any).email,
        firstName: (req.user as any).firstName,
        lastName: (req.user as any).lastName,
        phone: (req.user as any).phone,
        profilePicture: (req.user as any).profilePicture
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Get available items
router.get('/items', async (req: Request, res: Response) => {
  try {
    const items = await Item.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Failed to fetch items' });
  }
});

// Get user's purchased items
router.get('/purchases', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const purchases = await Purchase.find({ user: (req.user as any)._id })
      .populate('item')
      .sort({ purchaseDate: -1 });

    // Format the response to match the frontend expectations
    const formattedPurchases = purchases
      .filter(purchase => purchase.item) // Filter out purchases with null items
      .map(purchase => {
        const item = purchase.item as any;
        const base = {
          id: item._id,
          title: item.title,
          description: item.description,
          price: purchase.amount,
          type: item.type,
          duration: item.duration,
          purchasedAt: purchase.purchaseDate.toISOString(),
          status: purchase.status
        };

        // Add interview-specific fields for interview type items
        if (item.type === 'interview') {
          return {
            ...base,
            interviewsPurchased: purchase.interviewsPurchased,
            interviewsUsed: purchase.interviewsUsed,
            interviewsRemaining: purchase.interviewsPurchased - purchase.interviewsUsed
          };
        }

        return base;
      });

    res.json({ purchases: formattedPurchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Failed to fetch purchases' });
  }
});

// Update user profile
router.put('/profile', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { firstName, lastName, phone } = req.body;

    // Update user (email and profile picture cannot be changed)
    const updatedUser = await User.findByIdAndUpdate(
      (req.user as any)._id,
      {
        firstName,
        lastName,
        phone
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        profilePicture: updatedUser.profilePicture
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// CRUD Operations for Items (Admin routes - you might want to add authentication middleware)

// Create a new item
router.post('/items', async (req: Request, res: Response) => {
  try {
    const { title, description, price, type, duration, level } = req.body;

    if (!title || !description || !price || !type) {
      return res.status(400).json({ message: 'Title, description, price, and type are required' });
    }

    const item = new Item({
      title,
      description,
      price,
      type,
      duration,
      level
    });

    await item.save();
    res.status(201).json({ item });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Failed to create item' });
  }
});

// Update an item
router.put('/items/:id', async (req: Request, res: Response) => {
  try {
    const { title, description, price, type, duration, level, isActive } = req.body;

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { title, description, price, type, duration, level, isActive },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ item });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Failed to update item' });
  }
});

// Delete an item
router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

// Purchase an item
router.post('/purchase/:itemId', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const item = await Item.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (!item.isActive) {
      return res.status(400).json({ message: 'Item is not available' });
    }

    // Get quantity from request body (default to 1)
    const quantity = parseInt(req.body.quantity) || 1;
    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({ message: 'Quantity must be between 1 and 10' });
    }

    // For interview type items, allow purchasing multiple and adding to existing
    if (item.type === 'interview') {
      // Check if user already has an active purchase for this interview item
      const existingPurchase = await Purchase.findOne({
        user: (req.user as any)._id,
        item: item._id,
        status: 'active'
      });

      if (existingPurchase) {
        // Add to existing purchase
        existingPurchase.interviewsPurchased += quantity;
        existingPurchase.amount += item.price * quantity;
        await existingPurchase.save();

        return res.status(200).json({
          message: `Successfully added ${quantity} interview${quantity > 1 ? 's' : ''} to your account`,
          purchase: {
            id: existingPurchase._id,
            item: item,
            purchaseDate: existingPurchase.purchaseDate,
            status: existingPurchase.status,
            interviewsPurchased: existingPurchase.interviewsPurchased,
            interviewsUsed: existingPurchase.interviewsUsed,
            interviewsRemaining: existingPurchase.interviewsPurchased - existingPurchase.interviewsUsed
          }
        });
      }

      // Create new purchase with interview count
      const purchase = new Purchase({
        user: (req.user as any)._id,
        item: item._id,
        amount: item.price * quantity,
        interviewsPurchased: quantity,
        interviewsUsed: 0,
        expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months
      });

      await purchase.save();

      return res.status(201).json({
        message: `Successfully purchased ${quantity} interview${quantity > 1 ? 's' : ''}`,
        purchase: {
          id: purchase._id,
          item: item,
          purchaseDate: purchase.purchaseDate,
          status: purchase.status,
          interviewsPurchased: purchase.interviewsPurchased,
          interviewsUsed: purchase.interviewsUsed,
          interviewsRemaining: purchase.interviewsPurchased - purchase.interviewsUsed
        }
      });
    }

    // For non-interview items, check for existing purchase
    const existingPurchase = await Purchase.findOne({
      user: (req.user as any)._id,
      item: item._id,
      status: { $in: ['active', 'completed'] }
    });

    if (existingPurchase) {
      return res.status(400).json({ message: 'Item already purchased' });
    }

    // Create purchase record for non-interview items
    const purchase = new Purchase({
      user: (req.user as any)._id,
      item: item._id,
      amount: item.price,
      // Set expiry date based on duration (simplified logic)
      expiryDate: item.duration ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) : null // 6 months default
    });

    await purchase.save();

    res.status(201).json({
      message: 'Purchase successful',
      purchase: {
        id: purchase._id,
        item: item,
        purchaseDate: purchase.purchaseDate,
        status: purchase.status
      }
    });
  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({ message: 'Failed to process purchase' });
  }
});

export default router;