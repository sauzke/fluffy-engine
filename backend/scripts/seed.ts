import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Define seedable lookups
interface SeedData {
  name: string;
  data: Record<string, unknown>[];
}

const lookups: SeedData[] = [
  {
    name: 'category',
    data: [
      { name: 'Dining', color: '#E74C3C' },
      { name: 'Groceries', color: '#27AE60' },
      { name: 'Transportation', color: '#3498DB' },
      { name: 'Utilities', color: '#F39C12' },
      { name: 'Health & Fitness', color: '#9B59B6' },
      { name: 'Shopping', color: '#FFD700' },
      { name: 'Subscriptions', color: '#1ABC9C' },
      { name: 'Travel', color: '#34495E' },
      { name: 'Other', color: '#95A5A6' },
    ],
  },
  // Add more lookups here in the future
  // {
  //   name: 'status',
  //   data: [...]
  // }
];

async function seedLookup(lookup: SeedData): Promise<void> {
  const table = (prisma[lookup.name as keyof PrismaClient] as any);
  
  console.log(`🗑️  Clearing ${lookup.name}s...`);
  try {
    await table.deleteMany({});
    console.log(`✅ Cleared ${lookup.name}s`);
  } catch (error) {
    console.error(`Error clearing ${lookup.name}s:`, error);
    throw error;
  }

  console.log(`🌱 Seeding ${lookup.name}s...`);
  for (const item of lookup.data) {
    try {
      await table.create({ data: item });
      console.log(`  ✅ Created ${item.name}`);
    } catch (error) {
      console.error(`  ❌ Error creating ${item.name}:`, error);
      throw error;
    }
  }
  console.log('');
}

async function main(): Promise<void> {
  try {
    for (const lookup of lookups) {
      await seedLookup(lookup);
    }
    console.log('✨ Seeding completed!');
  } catch (error) {
    console.error('Fatal seeding error:', error);
    process.exit(1);
  }
}

main()
  .catch((error: Error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
