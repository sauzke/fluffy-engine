import { prisma } from '../server.js';
import {
  parseTransactions,
  extractCategoryFromDescription,
} from './csvParsingService.js';
import type { Upload, Transaction } from '../generated/prisma/client';

interface ProcessedUploadResult {
  uploadId: number;
  transactionCount: number;
  duplicateCount: number;
  transactions: Transaction[];
}

interface UploadFile {
  originalname: string;
  buffer: Buffer;
}

/**
 * Process uploaded CSV file and extract transactions
 */
export async function processUpload(file: UploadFile): Promise<ProcessedUploadResult> {
  let upload: Upload | null = null;

  try {
    // Create upload record
    upload = await prisma.upload.create({
      data: {
        filename: file.originalname,
        status: 'processing',
      },
    });

    // Use buffer from memory storage
    const csvBuffer = file.buffer;

    // Parse transactions from CSV
    const parsedTransactions = await parseTransactions(csvBuffer);

    if (!parsedTransactions || parsedTransactions.length === 0) {
      throw new Error(
        'No transactions found in CSV. Please ensure the file is a valid transaction export with Date and Amount columns.'
      );
    }

    // Get default category (or create if not exists)
    let defaultCategory = await prisma.category.findUnique({
      where: { name: 'Other' },
    });

    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: { name: 'Other', color: '#808080' },
      });
    }

    // Process each transaction
    const createdTransactions: Transaction[] = [];
    let duplicateCount = 0;

    for (const txn of parsedTransactions) {
      // Check for duplicates based on external_id and date
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          external_id: txn.external_id,
          date: txn.date,
        },
      });

      if (existingTransaction) {
        duplicateCount++;
        continue; // Skip this transaction
      }

      // Extract category name from description
      const categoryName = extractCategoryFromDescription(txn.description);
      
      // Find or use category
      let categoryRecord = await prisma.category.findUnique({
        where: { name: categoryName },
      });

      // If category doesn't exist, use default
      if (!categoryRecord) {
        categoryRecord = defaultCategory;
      }

      const transaction = await prisma.transaction.create({
        data: {
          description: txn.description,
          amount: txn.amount,
          date: txn.date,
          external_id: txn.external_id,
          categoryId: categoryRecord.id,
          uploadId: upload.id,
        },
      });

      createdTransactions.push(transaction);
    }

    // Update upload record with success
    await prisma.upload.update({
      where: { id: upload.id },
      data: {
        status: 'completed',
        transactionCount: createdTransactions.length,
      },
    });

    // Log summary
    if (duplicateCount > 0) {
      console.log(`\n⚠️  Upload Summary:`);
      console.log(`  ✓ Imported: ${createdTransactions.length} new transactions`);
      console.log(`  ⚠️  Skipped: ${duplicateCount} duplicate transactions\n`);
    }

    return {
      uploadId: upload.id,
      transactionCount: createdTransactions.length,
      duplicateCount,
      transactions: createdTransactions,
    };
  } catch (error) {
    console.error('Upload processing error:', error);

    // Update upload record with error
    if (upload) {
      await prisma.upload.update({
        where: { id: upload.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    throw error;
  }
}

export default {
  processUpload,
};
