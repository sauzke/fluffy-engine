import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../server.js';
import { processUpload } from '../services/uploadService';

const router: Router = express.Router();

// Configure multer for file uploads - use memory storage for streaming
const upload = multer({
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

/**
 * POST /api/upload
 * Upload a transaction CSV file and process transactions
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const result = await processUpload(req.file);
    res.json({
      success: true,
      uploadId: result.uploadId,
      transactionCount: result.transactionCount,
      duplicateCount: result.duplicateCount,
    });
  } catch (error) {
    console.error('Upload endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /api/transactions
 * Fetch transactions for a specific month
 * Query params: month (YYYY-MM format)
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(String(month))) {
      return res.status(400).json({
        error: 'Invalid month format. Use YYYY-MM',
      });
    }

    const [year, monthNum] = String(month).split('-');
    const startDate = new Date(Number(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(Number(year), parseInt(monthNum), 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { date: 'desc' },
    });

    res.json({
      month,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error('Transactions endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * GET /api/summary
 * Get spending summary by category for a specific month
 * Query params: month (YYYY-MM format)
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(String(month))) {
      return res.status(400).json({
        error: 'Invalid month format. Use YYYY-MM',
      });
    }

    const [year, monthNum] = String(month).split('-');
    const startDate = new Date(Number(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(Number(year), parseInt(monthNum), 0);

    // Get all transactions for the month with category info
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { category: true },
    });

    // Group by category and aggregate
    interface CategoryGroup {
      category: any;
      amount: number;
      count: number;
    }

    const groupedByCategory: Record<number, CategoryGroup> = {};
    let totalSpending = 0;

    transactions.forEach((transaction) => {
      const categoryId = transaction.categoryId;
      if (!groupedByCategory[categoryId]) {
        groupedByCategory[categoryId] = {
          category: transaction.category,
          amount: 0,
          count: 0,
        };
      }
      groupedByCategory[categoryId].amount += parseFloat(transaction.amount.toString());
      groupedByCategory[categoryId].count += 1;
      totalSpending += parseFloat(transaction.amount.toString());
    });

    // Format summary with percentages
    const formattedSummary = Object.values(groupedByCategory).map((item) => ({
      category: item.category,
      amount: item.amount,
      count: item.count,
      percentage: totalSpending > 0 ? ((item.amount / totalSpending) * 100).toFixed(2) : 0,
    }));

    res.json({
      month,
      totalSpending: totalSpending.toFixed(2),
      summary: formattedSummary,
    });
  } catch (error) {
    console.error('Summary endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

/**
 * GET /api/categories
 * Get all available categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('Categories endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * POST /api/categories
 * Create a new category
 */
router.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await prisma.category.create({
      data: { name, color },
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

export default router;
