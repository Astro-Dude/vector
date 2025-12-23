import { Router, Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import Purchase from '../models/Purchase.js';
import Item from '../models/Item.js';
import InterviewResult from '../models/InterviewResult.js';
import InterviewQuestion from '../models/InterviewQuestion.js';
import TestQuestion from '../models/TestQuestion.js';
import TestResult from '../models/TestResult.js';
import Coupon from '../models/Coupon.js';
import Referral from '../models/Referral.js';
import ReferralSettings from '../models/ReferralSettings.js';

const router = Router();

// Block admin routes in production
const blockInProduction = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Not allowed in production' });
    return;
  }
  next();
};

// Apply production block to all admin routes
router.use(blockInProduction);

// Get all users with their spend breakdown
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('-__v').lean();

    // Get spend breakdown for each user
    const usersWithSpend = await Promise.all(
      users.map(async (user) => {
        const purchases = await Purchase.find({ user: user._id }).lean();

        // Total paid (actual spending)
        const totalPaid = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Assigned value (calculated from assigned credits * item price)
        const totalAssigned = await Purchase.aggregate([
          { $match: { user: user._id } },
          {
            $lookup: {
              from: 'items',
              localField: 'item',
              foreignField: '_id',
              as: 'itemDetails'
            }
          },
          { $unwind: '$itemDetails' },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$creditsAssigned', '$itemDetails.price'] } }
            }
          }
        ]);
        const totalAssignedValue = totalAssigned[0]?.total || 0;

        return {
          ...user,
          totalPaid,
          totalAssigned: totalAssignedValue
        };
      })
    );

    res.json(usersWithSpend);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all purchases
router.get('/purchases', async (_req: Request, res: Response) => {
  try {
    const purchases = await Purchase.find({})
      .populate('user', 'firstName lastName email')
      .populate('item', 'title price')
      .sort({ createdAt: -1 })
      .lean();

    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

// Get all items
router.get('/items', async (_req: Request, res: Response) => {
  try {
    const items = await Item.find({}).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Create new item
router.post('/items', async (req: Request, res: Response) => {
  try {
    const { title, description, price, type, duration, timeLimit, questionCount } = req.body;

    const itemData: Record<string, unknown> = {
      title,
      description,
      price,
      type: type || 'interview'
    };

    // Only add duration if it's not empty
    if (duration && typeof duration === 'string' && duration.trim()) {
      itemData.duration = duration.trim();
    }

    // Only add test-specific fields for test type
    if (type === 'test') {
      if (timeLimit) itemData.timeLimit = timeLimit;
      if (questionCount) itemData.questionCount = questionCount;
    }

    const item = new Item(itemData);

    await item.save();
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create item';
    res.status(500).json({ error: errorMessage });
  }
});

// Update item
router.put('/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await Item.findByIdAndUpdate(id, updates, { new: true });
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    res.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await Item.findByIdAndDelete(id);

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Assign item to user (create purchase without payment)
router.post('/assign', async (req: Request, res: Response) => {
  try {
    const { userId, itemId, quantity } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get item details
    const item = await Item.findById(itemId);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const creditCount = quantity || 1;

    // Find existing active purchase for this item
    const existingPurchase = await Purchase.findOne({
      user: userId,
      item: itemId,
      status: 'active'
    });

    if (item.type === 'interview') {
      // Interviews: add assigned credits to existing or create new purchase
      if (existingPurchase) {
        // Add to existing purchase
        existingPurchase.creditsAssigned += creditCount;
        await existingPurchase.save();

        const totalCredits = existingPurchase.credits + existingPurchase.creditsAssigned;
        const remaining = totalCredits - existingPurchase.creditsUsed;

        res.status(200).json({
          message: `Added ${creditCount} credit(s) to ${user.email}. Total: ${totalCredits}, Used: ${existingPurchase.creditsUsed}, Remaining: ${remaining}`,
          purchase: existingPurchase
        });
      } else {
        // Create new purchase with assigned credits
        const purchase = new Purchase({
          user: userId,
          item: itemId,
          credits: 0,
          creditsUsed: 0,
          creditsAssigned: creditCount,
          amount: 0,
          status: 'active'
        });

        await purchase.save();

        res.status(201).json({
          message: `Assigned ${creditCount} credit(s) to ${user.email}`,
          purchase
        });
      }
    } else if (item.type === 'test') {
      // Tests: check if user already has access, if not assign it
      if (existingPurchase) {
        res.status(200).json({
          message: `${user.email} already has access to "${item.title}"`,
          purchase: existingPurchase
        });
        return;
      }

      // Create new purchase for test (unlimited access)
      const purchase = new Purchase({
        user: userId,
        item: itemId,
        credits: 0,
        creditsUsed: 0,
        creditsAssigned: 1, // 1 credit = unlimited access for tests
        amount: 0,
        status: 'active'
      });

      await purchase.save();

      res.status(201).json({
        message: `Assigned test "${item.title}" to ${user.email} (unlimited access)`,
        purchase
      });
    } else {
      // Courses or other types - check if exists, if not create
      if (existingPurchase) {
        res.status(200).json({
          message: `${user.email} already has access to "${item.title}"`,
          purchase: existingPurchase
        });
        return;
      }

      const purchase = new Purchase({
        user: userId,
        item: itemId,
        credits: 0,
        creditsUsed: 0,
        creditsAssigned: 1,
        amount: 0,
        status: 'active'
      });

      await purchase.save();

      res.status(201).json({
        message: `Assigned "${item.title}" to ${user.email}`,
        purchase
      });
    }
  } catch (error) {
    console.error('Error assigning item:', error);
    res.status(500).json({ error: 'Failed to assign item' });
  }
});

// Get all interview results
router.get('/interviews', async (_req: Request, res: Response) => {
  try {
    const results = await InterviewResult.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json(results);
  } catch (error) {
    console.error('Error fetching interview results:', error);
    res.status(500).json({ error: 'Failed to fetch interview results' });
  }
});

// Get interview result by session ID
router.get('/interviews/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await InterviewResult.findOne({ sessionId }).lean();

    if (!result) {
      res.status(404).json({ error: 'Interview result not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching interview result:', error);
    res.status(500).json({ error: 'Failed to fetch interview result' });
  }
});

// Get stats summary with detailed data for charts
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalEarningsResult,
      totalAssignedResult,
      purchasesByType,
      earningsOverTime,
      usersOverTime,
      interviewsCount,
      testsCount
    ] = await Promise.all([
      User.countDocuments(),
      // Total earnings (what users actually paid)
      Purchase.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Total assigned value (creditsAssigned * item price)
      Purchase.aggregate([
        {
          $lookup: {
            from: 'items',
            localField: 'item',
            foreignField: '_id',
            as: 'itemDetails'
          }
        },
        { $unwind: '$itemDetails' },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$creditsAssigned', '$itemDetails.price'] } }
          }
        }
      ]),
      // Purchases by item type (for pie chart)
      Purchase.aggregate([
        {
          $lookup: {
            from: 'items',
            localField: 'item',
            foreignField: '_id',
            as: 'itemDetails'
          }
        },
        { $unwind: '$itemDetails' },
        {
          $group: {
            _id: '$itemDetails.type',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalAssigned: { $sum: { $multiply: ['$creditsAssigned', '$itemDetails.price'] } }
          }
        }
      ]),
      // Earnings over time (last 12 months) - only actual paid amounts
      Purchase.aggregate([
        { $match: { amount: { $gt: 0 } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      // Users over time (last 12 months)
      User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      // Total credits for interviews (purchased only, not assigned)
      Purchase.aggregate([
        {
          $lookup: {
            from: 'items',
            localField: 'item',
            foreignField: '_id',
            as: 'itemDetails'
          }
        },
        { $unwind: '$itemDetails' },
        { $match: { 'itemDetails.type': 'interview' } },
        {
          $group: {
            _id: null,
            totalCredits: { $sum: '$credits' },
            totalAssigned: { $sum: '$creditsAssigned' },
            totalUsed: { $sum: '$creditsUsed' }
          }
        }
      ]),
      // Total tests purchased (only actual purchases, not assigned)
      Purchase.aggregate([
        {
          $lookup: {
            from: 'items',
            localField: 'item',
            foreignField: '_id',
            as: 'itemDetails'
          }
        },
        { $unwind: '$itemDetails' },
        { $match: { 'itemDetails.type': 'test', amount: { $gt: 0 } } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ])
    ]);

    // Only count purchased credits, not assigned ones
    const totalInterviewCredits = interviewsCount[0]?.totalCredits || 0;

    res.json({
      totalUsers,
      totalEarnings: totalEarningsResult[0]?.total || 0,
      totalAssigned: totalAssignedResult[0]?.total || 0,
      totalInterviewCredits,
      totalInterviewCreditsUsed: interviewsCount[0]?.totalUsed || 0,
      totalTestsPurchased: testsCount[0]?.count || 0,
      purchasesByType,
      earningsOverTime,
      usersOverTime
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ==================== INTERVIEW QUESTIONS ====================

// Get all interview questions
router.get('/questions', async (_req: Request, res: Response) => {
  try {
    const questions = await InterviewQuestion.find({})
      .sort({ category: 1, difficulty: 1, createdAt: -1 })
      .lean();
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Create new interview question
router.post('/questions', async (req: Request, res: Response) => {
  try {
    const { question, answer, category, difficulty } = req.body;

    if (!question || !answer || !category) {
      res.status(400).json({ error: 'Question, answer, and category are required' });
      return;
    }

    const newQuestion = new InterviewQuestion({
      question,
      answer,
      category,
      difficulty: difficulty || 'medium',
      isActive: true
    });

    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Update interview question
router.put('/questions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const question = await InterviewQuestion.findByIdAndUpdate(id, updates, { new: true });
    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete interview question
router.delete('/questions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const question = await InterviewQuestion.findByIdAndDelete(id);

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Toggle question active status
router.patch('/questions/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const question = await InterviewQuestion.findById(id);

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    question.isActive = !question.isActive;
    await question.save();

    res.json(question);
  } catch (error) {
    console.error('Error toggling question:', error);
    res.status(500).json({ error: 'Failed to toggle question status' });
  }
});

// ==================== TEST QUESTIONS ====================

// Get all test questions (optionally filter by testId)
router.get('/test-questions', async (req: Request, res: Response) => {
  try {
    const { testId } = req.query;
    const filter: Record<string, unknown> = {};
    if (testId) filter.testId = testId;

    const questions = await TestQuestion.find(filter)
      .populate('testId', 'title')
      .sort({ testId: 1, category: 1, difficulty: 1, createdAt: -1 })
      .lean();
    res.json(questions);
  } catch (error) {
    console.error('Error fetching test questions:', error);
    res.status(500).json({ error: 'Failed to fetch test questions' });
  }
});

// Create new test question
router.post('/test-questions', async (req: Request, res: Response) => {
  try {
    const { testId, question, type, options, correctAnswer, note, score, category, difficulty } = req.body;

    if (!testId || !question || correctAnswer === undefined || !category) {
      res.status(400).json({ error: 'testId, question, correctAnswer, and category are required' });
      return;
    }

    const questionType = type || 'mcq';

    // Validate based on question type
    if (questionType === 'mcq') {
      if (!Array.isArray(options) || options.length < 2) {
        res.status(400).json({ error: 'At least 2 options are required for MCQ' });
        return;
      }

      if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer >= options.length) {
        res.status(400).json({ error: 'correctAnswer must be a valid option index for MCQ' });
        return;
      }
    } else {
      // Short answer type
      if (!String(correctAnswer).trim()) {
        res.status(400).json({ error: 'correctAnswer is required for short answer questions' });
        return;
      }
    }

    const newQuestion = new TestQuestion({
      testId,
      question,
      type: questionType,
      options: questionType === 'mcq' ? options : [],
      correctAnswer,
      note: note || undefined,
      score: score || 1,
      category,
      difficulty: difficulty || 'medium',
      isActive: true
    });

    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error creating test question:', error);
    res.status(500).json({ error: 'Failed to create test question' });
  }
});

// Update test question
router.put('/test-questions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const questionType = updates.type || 'mcq';

    // Validate based on question type
    if (questionType === 'mcq') {
      if (updates.options && updates.correctAnswer !== undefined) {
        if (typeof updates.correctAnswer !== 'number' || updates.correctAnswer < 0 || updates.correctAnswer >= updates.options.length) {
          res.status(400).json({ error: 'correctAnswer must be a valid option index for MCQ' });
          return;
        }
      }
    } else {
      // Short answer type - ensure options is empty array
      updates.options = [];
    }

    const question = await TestQuestion.findByIdAndUpdate(id, updates, { new: true });
    if (!question) {
      res.status(404).json({ error: 'Test question not found' });
      return;
    }

    res.json(question);
  } catch (error) {
    console.error('Error updating test question:', error);
    res.status(500).json({ error: 'Failed to update test question' });
  }
});

// Delete test question
router.delete('/test-questions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const question = await TestQuestion.findByIdAndDelete(id);

    if (!question) {
      res.status(404).json({ error: 'Test question not found' });
      return;
    }

    res.json({ message: 'Test question deleted successfully' });
  } catch (error) {
    console.error('Error deleting test question:', error);
    res.status(500).json({ error: 'Failed to delete test question' });
  }
});

// Toggle test question active status
router.patch('/test-questions/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const question = await TestQuestion.findById(id);

    if (!question) {
      res.status(404).json({ error: 'Test question not found' });
      return;
    }

    question.isActive = !question.isActive;
    await question.save();

    res.json(question);
  } catch (error) {
    console.error('Error toggling test question:', error);
    res.status(500).json({ error: 'Failed to toggle test question status' });
  }
});

// ==================== TEST RESULTS ====================

// Get all test results (optionally filter by testId or userId)
router.get('/test-results', async (req: Request, res: Response) => {
  try {
    const { testId, userId } = req.query;
    const filter: Record<string, unknown> = {};
    if (testId) filter.testId = testId;
    if (userId) filter.userId = userId;

    const results = await TestResult.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('testId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    res.json(results);
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

// Get test result by session ID
router.get('/test-results/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await TestResult.findOne({ sessionId })
      .populate('userId', 'firstName lastName email')
      .populate('testId', 'title')
      .lean();

    if (!result) {
      res.status(404).json({ error: 'Test result not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching test result:', error);
    res.status(500).json({ error: 'Failed to fetch test result' });
  }
});

// ==================== ADMIN MANAGEMENT ====================

// Get all admins
router.get('/admins', async (_req: Request, res: Response) => {
  try {
    const admins = await User.find({ isAdmin: true })
      .select('_id email firstName lastName profilePicture createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Add admin by email
router.post('/admins', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      res.status(404).json({ error: 'User not found with this email' });
      return;
    }

    if (user.isAdmin) {
      res.status(400).json({ error: 'User is already an admin' });
      return;
    }

    user.isAdmin = true;
    await user.save();

    res.json({
      message: 'Admin added successfully',
      admin: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({ error: 'Failed to add admin' });
  }
});

// Remove admin
router.delete('/admins/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.isAdmin) {
      res.status(400).json({ error: 'User is not an admin' });
      return;
    }

    user.isAdmin = false;
    await user.save();

    res.json({ message: 'Admin removed successfully' });
  } catch (error) {
    console.error('Error removing admin:', error);
    res.status(500).json({ error: 'Failed to remove admin' });
  }
});

// ==================== COUPONS ====================

// Get all coupons
router.get('/coupons', async (_req: Request, res: Response) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    res.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Create coupon
router.post('/coupons', async (req: Request, res: Response) => {
  try {
    const { code, discountType, discountValue, applicableTypes, maxUses, expiryDate } = req.body;

    if (!code || !discountType || discountValue === undefined || !applicableTypes?.length) {
      res.status(400).json({ error: 'Code, discount type, discount value, and applicable types are required' });
      return;
    }

    // Check if code already exists
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      res.status(400).json({ error: 'Coupon code already exists' });
      return;
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      applicableTypes,
      maxUses: maxUses || 0,
      expiryDate: expiryDate || undefined
    });

    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Update coupon
router.put('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, applicableTypes, maxUses, expiryDate } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      res.status(404).json({ error: 'Coupon not found' });
      return;
    }

    // Check if new code already exists (if code is being changed)
    if (code && code.toUpperCase() !== coupon.code) {
      const existing = await Coupon.findOne({ code: code.toUpperCase() });
      if (existing) {
        res.status(400).json({ error: 'Coupon code already exists' });
        return;
      }
      coupon.code = code.toUpperCase();
    }

    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (applicableTypes) coupon.applicableTypes = applicableTypes;
    if (maxUses !== undefined) coupon.maxUses = maxUses;
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate || undefined;

    await coupon.save();
    res.json(coupon);
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// Delete coupon
router.delete('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      res.status(404).json({ error: 'Coupon not found' });
      return;
    }
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// Toggle coupon active status
router.patch('/coupons/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      res.status(404).json({ error: 'Coupon not found' });
      return;
    }
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json(coupon);
  } catch (error) {
    console.error('Error toggling coupon:', error);
    res.status(500).json({ error: 'Failed to toggle coupon' });
  }
});

// ==================== REFERRAL SETTINGS ====================

// Get referral settings
router.get('/referral-settings', async (_req: Request, res: Response) => {
  try {
    let settings = await ReferralSettings.findOne();
    if (!settings) {
      settings = await ReferralSettings.create({
        referralDiscountPercent: 10,
        referralRewardAmount: 50,
        minScoreForReward: 50,
        isActive: true
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Error fetching referral settings:', error);
    res.status(500).json({ error: 'Failed to fetch referral settings' });
  }
});

// Update referral settings
router.put('/referral-settings', async (req: Request, res: Response) => {
  try {
    const { referralDiscountPercent, referralRewardAmount, minScoreForReward, isActive } = req.body;

    let settings = await ReferralSettings.findOne();
    if (!settings) {
      settings = new ReferralSettings({});
    }

    if (referralDiscountPercent !== undefined) settings.referralDiscountPercent = referralDiscountPercent;
    if (referralRewardAmount !== undefined) settings.referralRewardAmount = referralRewardAmount;
    if (minScoreForReward !== undefined) settings.minScoreForReward = minScoreForReward;
    if (isActive !== undefined) settings.isActive = isActive;

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Error updating referral settings:', error);
    res.status(500).json({ error: 'Failed to update referral settings' });
  }
});

// ==================== REFERRALS ====================

// Get all referrals
router.get('/referrals', async (_req: Request, res: Response) => {
  try {
    const referrals = await Referral.find({})
      .populate('referrerId', 'email firstName lastName')
      .populate('referredUserId', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
    res.json(referrals);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// Mark referral as paid
router.patch('/referrals/:id/mark-paid', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const referral = await Referral.findById(id);
    if (!referral) {
      res.status(404).json({ error: 'Referral not found' });
      return;
    }
    if (referral.status !== 'successful' || referral.rewardStatus !== 'earned') {
      res.status(400).json({ error: 'Can only mark successful earned referrals as paid' });
      return;
    }
    referral.rewardStatus = 'paid';
    await referral.save();
    res.json(referral);
  } catch (error) {
    console.error('Error marking referral as paid:', error);
    res.status(500).json({ error: 'Failed to mark referral as paid' });
  }
});

export default router;
