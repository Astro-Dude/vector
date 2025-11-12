const express = require('express');
const passport = require('passport');
const Item = require('../models/Item');
const Purchase = require('../models/Purchase');
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
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login` }),
  (req, res) => {
    // Successful authentication, redirect to dashboard
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  }
);

// Check authentication status
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user._id,
        displayName: req.user.displayName,
        email: req.user.email,
        profilePicture: req.user.profilePicture
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Get available items
router.get('/items', async (req, res) => {
  try {
    const items = await Item.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Failed to fetch items' });
  }
});

// Get user's purchased items
router.get('/purchases', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const purchases = await Purchase.find({ user: req.user._id })
      .populate('item')
      .sort({ purchaseDate: -1 });

    // Format the response to match the frontend expectations
    const formattedPurchases = purchases.map(purchase => ({
      id: purchase.item._id,
      title: purchase.item.title,
      description: purchase.item.description,
      price: purchase.amount,
      type: purchase.item.type,
      duration: purchase.item.duration,
      purchasedAt: purchase.purchaseDate.toISOString(),
      status: purchase.status
    }));

    res.json({ purchases: formattedPurchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Failed to fetch purchases' });
  }
});

// CRUD Operations for Items (Admin routes - you might want to add authentication middleware)

// Create a new item
router.post('/items', async (req, res) => {
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
router.put('/items/:id', async (req, res) => {
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
router.delete('/items/:id', async (req, res) => {
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
router.post('/purchase/:itemId', async (req, res) => {
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

    // Check if user already purchased this item
    const existingPurchase = await Purchase.findOne({
      user: req.user._id,
      item: item._id,
      status: { $in: ['active', 'completed'] }
    });

    if (existingPurchase) {
      return res.status(400).json({ message: 'Item already purchased' });
    }

    // Create purchase record
    const purchase = new Purchase({
      user: req.user._id,
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

module.exports = router;