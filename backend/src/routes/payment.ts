import express, { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Item from '../models/Item.js';
import Purchase from '../models/Purchase.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import Referral from '../models/Referral.js';
import ReferralSettings from '../models/ReferralSettings.js';

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
    const { itemId, quantity = 1, discountCode } = req.body;
    const userId = (req.user as any)._id;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (!item.isActive) {
      return res.status(400).json({ message: 'Item is not available' });
    }

    let originalAmount = item.price * quantity;
    let discountAmount = 0;
    let discountType: 'coupon' | 'referral' | undefined;
    let couponId: string | undefined;
    let referrerId: string | undefined;

    // Process discount code if provided
    if (discountCode) {
      const upperCode = discountCode.toUpperCase().trim();

      // Check if it's a coupon
      const coupon = await Coupon.findOne({ code: upperCode });
      if (coupon) {
        if (!coupon.isActive) {
          return res.status(400).json({ message: 'This coupon is no longer active' });
        }
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
          return res.status(400).json({ message: 'This coupon has expired' });
        }
        if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
          return res.status(400).json({ message: 'This coupon has reached its usage limit' });
        }
        if (!coupon.applicableTypes.includes(item.type as 'interview' | 'test' | 'course')) {
          return res.status(400).json({ message: `This coupon is not applicable to ${item.type} purchases` });
        }

        discountType = 'coupon';
        couponId = (coupon._id as any).toString();
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.round(originalAmount * (coupon.discountValue / 100));
        } else {
          discountAmount = Math.min(coupon.discountValue, originalAmount);
        }
      } else {
        // Check if it's a referral code
        const referrer = await User.findOne({ referralCode: upperCode });
        if (referrer) {
          if ((referrer._id as any).toString() === userId.toString()) {
            return res.status(400).json({ message: 'You cannot use your own referral code' });
          }

          // Auto-create settings if not exists
          let settings = await ReferralSettings.findOne();
          if (!settings) {
            settings = await ReferralSettings.create({
              referralDiscountPercent: 10,
              referralRewardAmount: 50,
              minScoreForReward: 50,
              isActive: true
            });
          }

          if (!settings.isActive) {
            return res.status(400).json({ message: 'Referral system is currently disabled' });
          }

          if (item.type !== 'interview') {
            return res.status(400).json({ message: 'Referral codes can only be used for interview purchases' });
          }

          const currentUser = await User.findById(userId);
          if (currentUser?.referredBy) {
            return res.status(400).json({ message: 'You have already used a referral code' });
          }

          discountType = 'referral';
          referrerId = (referrer._id as any).toString();
          discountAmount = Math.round(originalAmount * (settings.referralDiscountPercent / 100));
        } else {
          return res.status(400).json({ message: 'Invalid discount code' });
        }
      }
    }

    const finalAmount = originalAmount - discountAmount;
    const amountInPaise = finalAmount * 100; // Razorpay expects amount in paise

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `ord_${Date.now()}`,
      notes: {
        itemId: String(item._id),
        userId: String(userId),
        quantity: String(quantity),
        itemType: item.type,
        discountCode: discountCode || '',
        discountType: discountType || '',
        discountAmount: String(discountAmount),
        originalAmount: String(originalAmount),
        couponId: couponId || '',
        referrerId: referrerId || ''
      }
    };

    const order = await getRazorpay().orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      itemTitle: item.title,
      itemType: item.type,
      quantity,
      originalAmount,
      discountAmount,
      finalAmount,
      discountType,
      discountCode: discountCode || undefined
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
      quantity = 1,
      discountCode
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

    // Recalculate discount on server side for security
    let originalAmount = item.price * quantity;
    let discountAmount = 0;
    let discountType: 'coupon' | 'referral' | undefined;
    let couponId: string | undefined;
    let referrerId: string | undefined;

    if (discountCode) {
      const upperCode = discountCode.toUpperCase().trim();
      console.log('[VERIFY] Processing discount code:', upperCode, 'for item type:', item.type);

      // Check if it's a coupon
      const coupon = await Coupon.findOne({ code: upperCode });
      console.log('[VERIFY] Coupon lookup result:', coupon ? { code: coupon.code, isActive: coupon.isActive, discountValue: coupon.discountValue } : null);

      if (coupon) {
        // Found a coupon - validate it
        const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
        const isMaxedOut = coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses;
        const isApplicable = coupon.applicableTypes.includes(item.type as 'interview' | 'test' | 'course');
        console.log('[VERIFY] Coupon validation:', { isActive: coupon.isActive, isExpired, isMaxedOut, isApplicable });

        if (coupon.isActive && !isExpired && !isMaxedOut && isApplicable) {
          discountType = 'coupon';
          couponId = (coupon._id as any).toString();
          if (coupon.discountType === 'percentage') {
            discountAmount = Math.round(originalAmount * (coupon.discountValue / 100));
          } else {
            discountAmount = Math.min(coupon.discountValue, originalAmount);
          }
          console.log('[VERIFY] Coupon discount applied:', discountAmount);
        }
      } else {
        // Not a coupon - check if it's a referral code
        const referrer = await User.findOne({ referralCode: upperCode });
        console.log('[VERIFY] Referral lookup result:', referrer ? { email: referrer.email, referralCode: referrer.referralCode } : null);

        if (referrer && (referrer._id as any).toString() !== userId.toString()) {
          // Use getSettings to auto-create if not exists
          let settings = await ReferralSettings.findOne();
          if (!settings) {
            settings = await ReferralSettings.create({
              referralDiscountPercent: 10,
              referralRewardAmount: 50,
              minScoreForReward: 50,
              isActive: true
            });
          }
          console.log('[VERIFY] Referral settings:', settings ? { isActive: settings.isActive, discountPercent: settings.referralDiscountPercent } : null);

          if (settings && settings.isActive && item.type === 'interview') {
            const currentUser = await User.findById(userId);
            console.log('[VERIFY] Current user referredBy:', currentUser?.referredBy);

            if (!currentUser?.referredBy) {
              discountType = 'referral';
              referrerId = (referrer._id as any).toString();
              discountAmount = Math.round(originalAmount * (settings.referralDiscountPercent / 100));
              console.log('[VERIFY] Referral discount applied:', discountAmount);
            }
          }
        }
      }
    } else {
      console.log('[VERIFY] No discount code provided');
    }

    const finalAmount = originalAmount - discountAmount;
    console.log('[VERIFY] Final calculation:', { originalAmount, discountAmount, finalAmount, discountType });

    // Handle referral if used
    let referralRecord = null;
    if (discountType === 'referral' && referrerId) {
      // Mark user as referred
      await User.findByIdAndUpdate(userId, { referredBy: referrerId });

      // Create referral record
      referralRecord = new Referral({
        referrerId: referrerId,
        referredUserId: userId,
        status: 'pending',
        rewardAmount: 0,
        rewardStatus: 'pending'
      });
      await referralRecord.save();
    }

    // Increment coupon usage if used
    if (discountType === 'coupon' && couponId) {
      await Coupon.findByIdAndUpdate(couponId, { $inc: { currentUses: 1 } });
    }

    // For interview type items, always create a new purchase record
    if (item.type === 'interview') {
      // Create new purchase record
      const purchase = new Purchase({
        user: userId,
        item: item._id,
        amount: finalAmount,
        quantity: quantity,
        purchaseType: 'paid',
        originalAmount: originalAmount,
        discountAmount: discountAmount,
        discountType: discountType || undefined,
        discountCode: discountCode || undefined,
        couponId: couponId || undefined,
        referralId: referralRecord?._id || undefined,
        expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months
      });

      await purchase.save();

      // Update user's interview credits
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { interviewCredits: quantity } },
        { new: true }
      );

      // Update referral with purchase ID
      if (referralRecord) {
        referralRecord.purchaseId = purchase._id as any;
        await referralRecord.save();
      }

      return res.json({
        success: true,
        message: `Successfully purchased ${quantity} interview credit${quantity > 1 ? 's' : ''}`,
        purchase: {
          id: purchase._id,
          quantity: purchase.quantity,
          creditsRemaining: (updatedUser?.interviewCredits || quantity) - (updatedUser?.interviewCreditsUsed || 0)
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

    // Create purchase record for non-interview items
    const purchase = new Purchase({
      user: userId,
      item: item._id,
      amount: finalAmount,
      quantity: 1,
      purchaseType: 'paid',
      originalAmount: originalAmount,
      discountAmount: discountAmount,
      discountType: discountType || undefined,
      discountCode: discountCode || undefined,
      couponId: couponId || undefined,
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

// Validate discount code (coupon or referral)
router.post('/validate-code', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { code, itemType } = req.body;
    const userId = (req.user as any)._id;

    if (!code) {
      return res.status(400).json({ valid: false, message: 'Code is required' });
    }

    const upperCode = code.toUpperCase().trim();

    // First check if it's a coupon
    const coupon = await Coupon.findOne({ code: upperCode });
    if (coupon) {
      // Validate coupon
      if (!coupon.isActive) {
        return res.json({ valid: false, message: 'This coupon is no longer active' });
      }
      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        return res.json({ valid: false, message: 'This coupon has expired' });
      }
      if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
        return res.json({ valid: false, message: 'This coupon has reached its usage limit' });
      }
      if (itemType && !coupon.applicableTypes.includes(itemType)) {
        return res.json({ valid: false, message: `This coupon is not applicable to ${itemType} purchases` });
      }

      return res.json({
        valid: true,
        type: 'coupon',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        applicableTypes: coupon.applicableTypes,
        message: coupon.discountType === 'percentage'
          ? `${coupon.discountValue}% discount will be applied`
          : `₹${coupon.discountValue} discount will be applied`
      });
    }

    // Check if it's a referral code
    const referrer = await User.findOne({ referralCode: upperCode });
    if (referrer) {
      // Can't use your own referral code
      if ((referrer._id as any).toString() === userId.toString()) {
        return res.json({ valid: false, message: 'You cannot use your own referral code' });
      }

      // Check if referral system is active (auto-create if not exists)
      let settings = await ReferralSettings.findOne();
      if (!settings) {
        settings = await ReferralSettings.create({
          referralDiscountPercent: 10,
          referralRewardAmount: 50,
          minScoreForReward: 50,
          isActive: true
        });
      }

      if (!settings.isActive) {
        return res.json({ valid: false, message: 'Referral system is currently disabled' });
      }

      // Referral codes only work for interviews
      if (itemType && itemType !== 'interview') {
        return res.json({ valid: false, message: 'Referral codes can only be used for interview purchases' });
      }

      // Check if user has already used a referral code before
      const currentUser = await User.findById(userId);
      if (currentUser?.referredBy) {
        return res.json({ valid: false, message: 'You have already used a referral code' });
      }

      return res.json({
        valid: true,
        type: 'referral',
        discountType: 'percentage',
        discountValue: settings.referralDiscountPercent,
        referrerId: referrer._id,
        message: `${settings.referralDiscountPercent}% referral discount will be applied`
      });
    }

    return res.json({ valid: false, message: 'Invalid code' });
  } catch (error) {
    console.error('Error validating code:', error);
    res.status(500).json({ valid: false, message: 'Failed to validate code' });
  }
});

export default router;
