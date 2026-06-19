import { v4 as uuidv4 } from 'uuid';

interface ParsedTransaction {
  description: string;
  amount: number;
  date: Date;
  external_id: string;
}

/**
 * Parse transactions from CSV buffer
 * Expected format: Date, Description, Amount, Merchant, etc.
 */
export async function parseTransactions(csvBuffer: Buffer): Promise<ParsedTransaction[]> {
  try {
    const csvText = csvBuffer.toString('utf-8');
    const lines = csvText.split('\n');

    if (lines.length < 2) {
      console.log('❌ CSV is empty or too short');
      return [];
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);
    const dateIdx = headers.findIndex((h) => h.toLowerCase().includes('date') && !h.toLowerCase().includes('processed'));
    const descIdx = headers.findIndex((h) => h.toLowerCase().includes('description'));
    const amountIdx = headers.findIndex((h) => h.toLowerCase().includes('amount') && !h.toLowerCase().includes('foreign') && !h.toLowerCase().includes('commission'));
    const merchantIdx = headers.findIndex((h) => h.toLowerCase().includes('merchant'));

    if (dateIdx === -1 || amountIdx === -1) {
      console.log('❌ Missing required columns (Date, Amount)');
      return [];
    }

    console.log('\n📊 CSV Parsing Started');
    console.log(`✓ Found columns: Date(${dateIdx}), Description(${descIdx}), Amount(${amountIdx}), Merchant(${merchantIdx})\n`);

    const transactions: ParsedTransaction[] = [];
    let processedCount = 0;
    let skippedCount = 0;

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const fields = parseCSVLine(line);
        const dateStr = fields[dateIdx]?.trim() || '';
        const description = fields[descIdx]?.trim() || '';
        const amountStr = fields[amountIdx]?.trim() || '0';
        const merchant = fields[merchantIdx]?.trim() || description;

        // Skip payment records and fees (unless they're charges)
        if (description.toLowerCase().includes('payment received')) {
          skippedCount++;
          continue;
        }

        // Parse amount - handle negative amounts from CSV
        const amount = Math.abs(parseFloat(amountStr.replace(/[$,]/g, '')));

        // Skip zero amounts
        if (amount === 0) {
          skippedCount++;
          continue;
        }

        // Parse date (format: "14 Jun 2026")
        const date = parseTransactionDate(dateStr);
        if (!date) {
          console.log(`  ⚠️  Skipping row ${i + 1}: Invalid date "${dateStr}"`);
          skippedCount++;
          continue;
        }

        const transaction: ParsedTransaction = {
          description: merchant || description,
          amount: parseFloat(amount.toFixed(2)),
          date,
          external_id: generateTransactionId(merchant || description, amountStr, dateStr),
        };

        transactions.push(transaction);
        processedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`  ⚠️  Error parsing row ${i + 1}: ${errorMessage}`);
        skippedCount++;
      }
    }

    console.log(`\n✓ CSV parsing complete`);
    console.log(`  Processed: ${processedCount} transactions`);
    console.log(`  Skipped: ${skippedCount} rows\n`);

    return transactions;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ CSV parsing error:', errorMessage);
    return [];
  }
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parse date from various formats
 * Handles: "14 Jun 2026" or "2026-06-14"
 */
function parseTransactionDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();

  // Format: "14 Jun 2026"
  const monthMatch = trimmed.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (monthMatch) {
    const [, day, monthStr, year] = monthMatch;
    const months: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const month = months[monthStr];
    if (month !== undefined) {
      return new Date(parseInt(year), month, parseInt(day));
    }
  }

  // Format: "2026-06-14"
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  return null;
}

/**
 * Generate unique ID for transaction (for duplicate detection)
 */
function generateTransactionId(description: string, amount: string, dateStr: string): string {
  const cleanDesc = description.replace(/\s+/g, '').substring(0, 20);
  const cleanAmount = amount.toString().replace(/[^0-9]/g, '');
  const cleanDate = dateStr.replace(/\s+/g, '');
  return `${cleanDate}_${cleanAmount}_${cleanDesc}`;
}

/**
 * Extract category from description/merchant using keyword matching
 */
export function extractCategoryFromDescription(description: string): string {
  if (!description) return 'Other';

  const text = description.toUpperCase();

  // Dining
  if (/SKIPTHEDISHES|UBER EATS|DOORDASH|FRESHSLICE|PIZZA|MCDONALD'S|SUBWAY|STARBUCKS|COFFEE|RESTAURANT|CAFE|BAR|PUB|DINING|FOOD DELIVERY/.test(text)) {
    return 'Dining';
  }

  // Groceries
  if (/SAFEWAY|COSTCO|WALMART|LOBLAWS|SOBEYS|METRO|SAVE ON FOODS|WHOLE FOODS|TRADER|GROCERY/.test(text)) {
    return 'Groceries';
  }

  // Transportation
  if (/UBER|LYFT|TAXI|ICBC|GAS|PARKING|SHELL|ESSO|PETRO|TRANSIT|AIRLINE|FLIGHT|RAILWAY/.test(text)) {
    return 'Transportation';
  }

  // Utilities
  if (/SHAW|BELL|TELUS|ROGERS|HYDRO|POWER|WATER|INTERNET|TELECOM|UTILITY/.test(text)) {
    return 'Utilities';
  }

  // Health & Fitness
  if (/PHARMACY|DOCTOR|HOSPITAL|CLINIC|GYM|FITNESS|YOGA|DENTAL|HEALTH|MEDICAL|WELLNESS|SPORT/.test(text)) {
    return 'Health & Fitness';
  }

  // Shopping
  if (/AMAZON|UNIQLO|ZARA|H&M|BEST BUY|LEGO|APPLE|TARGET|WALMART|COSTCO|CANADIAN TIRE|SHOPPERS|ELECTRONICS|RETAIL|HOME DEPOT/.test(text)) {
    return 'Shopping';
  }

  // Subscriptions
  if (/NETFLIX|SPOTIFY|APPLE|MICROSOFT|SUBSCRIPTION|MEMBERSHIP|ADOBE/.test(text)) {
    return 'Subscriptions';
  }

  // Travel
  if (/AIRLINE|HOTEL|AIRBNB|BOOKING|EXPEDIA|TRAVEL|MOTEL|RESORT/.test(text)) {
    return 'Travel';
  }

  return 'Other';
}
