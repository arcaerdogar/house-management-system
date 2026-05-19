import { prisma } from "../../src/config/db.js";

export function hasTestDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Wipes HouseMate + auth data (order respects FKs). */
export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "balance_snapshot_entries",
      "balance_snapshots",
      "expense_splits",
      "expense_exclusions",
      "expenses",
      "absences",
      "regular_expense_templates",
      "rotational_expense_types",
      "house_members",
      "houses",
      "ExpiredTwoFactorToken",
      "RefreshToken",
      "File",
      "User"
    RESTART IDENTITY CASCADE;
  `);
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
