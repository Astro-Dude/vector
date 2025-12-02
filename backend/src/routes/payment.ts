import express, { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Item from '../models/Item.js';
import Purchase from '../models/Purchase.js';

const router = express.Router();

// Lazy initialization of Razorpay to ensure env vars are loaded
let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      throw new Error('Razorpay credentials not configured');
    }

    razorpayInstance = new Razorpay({ key_id, key_secret });
  }
  return razorpayInstance;
}

// Create order
router.post('/create-order', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { itemId, quantity = 1 } = req.body;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (!item.isActive) {
      return res.status(400).json({ message: 'Item is not available' });
    }

    const amount = item.price * quantity * 100; // Razorpay expects amount in paise

    const options = {
      amount,
      currency: 'INR',
      receipt: `ord_${Date.now()}`,
      notes: {
        itemId: String(item._id),
        userId: String((req.user as any)._id),
        quantity: String(quantity),
        itemType: item.type
      }
    };

    const order = await getRazorpay().orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      itemTitle: item.title,
      itemType: item.type,
      quantity
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Verify payment and create purchase
router.post('/verify', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      itemId,
      quantity = 1
    } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Get item details
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const userId = (req.user as any)._id;

    // For interview type items, allow purchasing multiple and adding to existing
    if (item.type === 'interview') {
      const existingPurchase = await Purchase.findOne({
        user: userId,
        item: item._id,
        status: 'active'
      });

      if (existingPurchase) {
        // Add to existing purchase
        existingPurchase.credits += quantity;
        existingPurchase.amount += item.price * quantity;
        await existingPurchase.save();

        const totalCredits = existingPurchase.credits + existingPurchase.creditsAssigned;
        return res.json({
          success: true,
          message: `Successfully added ${quantity} interview credit${quantity > 1 ? 's' : ''} to your account`,
          purchase: {
            id: existingPurchase._id,
            credits: existingPurchase.credits,
            creditsUsed: existingPurchase.creditsUsed,
            creditsRemaining: totalCredits - existingPurchase.creditsUsed
          }
        });
      }

      // Create new purchase with credits
      const purchase = new Purchase({
        user: userId,
        item: item._id,
        amount: item.price * quantity,
        credits: quantity,
        creditsUsed: 0,
        creditsAssigned: 0,
        expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months
      });

      await purchase.save();

      return res.json({
        success: true,
        message: `Successfully purchased ${quantity} interview credit${quantity > 1 ? 's' : ''}`,
        purchase: {
          id: purchase._id,
          credits: purchase.credits,
          creditsUsed: 0,
          creditsRemaining: purchase.credits
        }
      });
    }

    // For non-interview items, check for existing purchase
    const existingPurchase = await Purchase.findOne({
      user: userId,
      item: item._id,
      status: { $in: ['active', 'completed'] }
    });

    if (existingPurchase) {
      return res.status(400).json({ message: 'Item already purchased' });
    }

    // Create purchase record
    const purchase = new Purchase({
      user: userId,
      item: item._id,
      amount: item.price,
      credits: 1,
      creditsUsed: 0,
      creditsAssigned: 0,
      expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months
    });

    await purchase.save();

    res.json({
      success: true,
      message: 'Purchase successful',
      purchase: {
        id: purchase._id
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Failed to verify payment' });
  }
});

// Get Razorpay key (public)
router.get('/key', (req: Request, res: Response) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

export default router;
