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
    const user = req.user as any;
    res.json({
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profilePicture: user.profilePicture
      },
      isAdmin: user.isAdmin || false,
      isImpersonating: !!req.session.originalAdminId
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Admin impersonation - become another user
router.get('/become/:email', async (req: Request, res: Response) => {
  const frontendUrl = process.env.NODE_ENV === 'production' ? '' : (process.env.FRONTEND_URL || 'http://localhost:5173');

  if (!req.isAuthenticated()) {
    return res.redirect(`${frontendUrl}/login`);
  }

  const currentUser = req.user as any;

  // Check if current user is admin
  if (!currentUser.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const targetEmail = decodeURIComponent(req.params.email);
    const targetUser = await User.findOne({ email: targetEmail });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Store original admin ID in session (only if not already impersonating)
    if (!req.session.originalAdminId) {
      req.session.originalAdminId = currentUser._id.toString();
    }

    // Log in as target user
    req.login(targetUser, (err) => {
      if (err) {
        console.error('Error during impersonation login:', err);
        return res.status(500).json({ error: 'Failed to impersonate user' });
      }
      res.redirect(`${frontendUrl}/home`);
    });
  } catch (error) {
    console.error('Error during impersonation:', error);
    res.status(500).json({ error: 'Failed to impersonate user' });
  }
});

// Stop impersonation - return to admin account
router.get('/stop-impersonation', async (req: Request, res: Response) => {
  const frontendUrl = process.env.NODE_ENV === 'production' ? '' : (process.env.FRONTEND_URL || 'http://localhost:5173');

  if (!req.isAuthenticated()) {
    return res.redirect(`${frontendUrl}/login`);
  }

  const originalAdminId = req.session.originalAdminId;

  if (!originalAdminId) {
    return res.redirect(`${frontendUrl}/home`);
  }

  try {
    const adminUser = await User.findById(originalAdminId);

    if (!adminUser) {
      // Clear invalid session data
      delete req.session.originalAdminId;
      return res.redirect(`${frontendUrl}/home`);
    }

    // Clear impersonation data
    delete req.session.originalAdminId;

    // Log back in as admin
    req.login(adminUser, (err) => {
      if (err) {
        console.error('Error restoring admin session:', err);
        return res.status(500).json({ error: 'Failed to restore admin session' });
      }
      res.redirect(`${frontendUrl}/admin`);
    });
  } catch (error) {
    console.error('Error stopping impersonation:', error);
    res.status(500).json({ error: 'Failed to stop impersonation' });
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
          _id: item._id.toString(),
          id: item._id.toString(),
          title: item.title,
          description: item.description,
          price: purchase.amount,
          type: item.type,
          duration: item.duration,
          purchasedAt: purchase.purchaseDate.toISOString(),
          status: purchase.status
        };

        // Add credit fields for interview type items
        if (item.type === 'interview') {
          // Handle migration from old fields
          const oldPurchase = purchase as any;
          let credits = purchase.credits;
          let creditsUsed = purchase.creditsUsed;
          if (oldPurchase.interviewsPurchased !== undefined && purchase.credits === 0) {
            credits = oldPurchase.interviewsPurchased || 0;
            creditsUsed = oldPurchase.interviewsUsed || 0;
          }

          const totalCredits = credits + purchase.creditsAssigned;
          return {
            ...base,
            credits,
            creditsUsed,
            creditsAssigned: purchase.creditsAssigned,
            creditsRemaining: totalCredits - creditsUsed
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
        // Migrate old fields if they exist (one-time migration)
        const oldPurchase = existingPurchase as any;
        if (oldPurchase.interviewsPurchased !== undefined && existingPurchase.credits === 0) {
          existingPurchase.credits = oldPurchase.interviewsPurchased || 0;
          existingPurchase.creditsUsed = oldPurchase.interviewsUsed || 0;
        }

        // Add to existing purchase (paid credits)
        existingPurchase.credits += quantity;
        existingPurchase.amount += item.price * quantity;
        await existingPurchase.save();

        const totalCredits = existingPurchase.credits + existingPurchase.creditsAssigned;
        return res.status(200).json({
          message: `Successfully added ${quantity} interview${quantity > 1 ? 's' : ''} to your account`,
          purchase: {
            id: existingPurchase._id,
            item: item,
            purchaseDate: existingPurchase.purchaseDate,
            status: existingPurchase.status,
            credits: existingPurchase.credits,
            creditsUsed: existingPurchase.creditsUsed,
            creditsAssigned: existingPurchase.creditsAssigned,
            creditsRemaining: totalCredits - existingPurchase.creditsUsed
          }
        });
      }

      // Create new purchase with credits
      const purchase = new Purchase({
        user: (req.user as any)._id,
        item: item._id,
        amount: item.price * quantity,
        credits: quantity,
        creditsUsed: 0,
        creditsAssigned: 0,
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
          credits: purchase.credits,
          creditsUsed: purchase.creditsUsed,
          creditsAssigned: purchase.creditsAssigned,
          creditsRemaining: purchase.credits - purchase.creditsUsed
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