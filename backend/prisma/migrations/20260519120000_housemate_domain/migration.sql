-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;

-- CreateEnum
CREATE TYPE "FilePurpose" AS ENUM ('PROFILE_PHOTO', 'POST_ATTACHMENT', 'DOCUMENT', 'OTHER', 'TEST_FILE');
CREATE TYPE "HouseMemberRole" AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE "ExpenseType" AS ENUM ('REGULAR', 'INSTANT', 'ROTATIONAL');
CREATE TYPE "RegularExpensePeriod" AS ENUM ('WEEKLY', 'MONTHLY');
CREATE TYPE "SnapshotTriggerType" AS ENUM ('ABSENCE_START', 'ABSENCE_END', 'MEMBER_JOIN');

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "purpose" "FilePurpose" NOT NULL,
    "key" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "houses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "monthly_summary_day" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "houses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "house_members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "role" "HouseMemberRole" NOT NULL DEFAULT 'MEMBER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "house_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "absences" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "regular_expense_templates" (
    "id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "responsible_member_id" TEXT NOT NULL,
    "period" "RegularExpensePeriod" NOT NULL,
    "respects_absence" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regular_expense_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rotational_expense_types" (
    "id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "respects_absence" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rotational_expense_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "payer_member_id" TEXT NOT NULL,
    "template_id" TEXT,
    "rotational_type_id" TEXT,
    "expense_type" "ExpenseType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "respects_absence" BOOLEAN NOT NULL,
    "expense_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expense_exclusions" (
    "id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "excluded_member_id" TEXT NOT NULL,

    CONSTRAINT "expense_exclusions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expense_splits" (
    "id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "debtor_member_id" TEXT NOT NULL,
    "amount_owed" DECIMAL(12,2) NOT NULL,
    "is_settled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "expense_splits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "balance_snapshots" (
    "id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "trigger_type" "SnapshotTriggerType" NOT NULL,
    "trigger_member_id" TEXT NOT NULL,
    "absence_id" TEXT,
    "rotational_counts" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "balance_snapshot_entries" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "creditor_member_id" TEXT NOT NULL,
    "debtor_member_id" TEXT NOT NULL,
    "net_amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "balance_snapshot_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_key_key" ON "File"("key");

CREATE UNIQUE INDEX "houses_invite_code_key" ON "houses"("invite_code");
CREATE UNIQUE INDEX "house_members_user_id_house_id_key" ON "house_members"("user_id", "house_id");
CREATE INDEX "house_members_house_id_is_active_idx" ON "house_members"("house_id", "is_active");
CREATE INDEX "absences_member_id_start_date_end_date_idx" ON "absences"("member_id", "start_date", "end_date");
CREATE INDEX "absences_house_id_idx" ON "absences"("house_id");
CREATE INDEX "regular_expense_templates_house_id_is_active_idx" ON "regular_expense_templates"("house_id", "is_active");
CREATE INDEX "rotational_expense_types_house_id_is_active_idx" ON "rotational_expense_types"("house_id", "is_active");
CREATE INDEX "expenses_house_id_expense_date_idx" ON "expenses"("house_id", "expense_date");
CREATE INDEX "expenses_house_id_expense_type_idx" ON "expenses"("house_id", "expense_type");
CREATE INDEX "expenses_rotational_type_id_created_at_idx" ON "expenses"("rotational_type_id", "created_at");
CREATE UNIQUE INDEX "expense_exclusions_expense_id_excluded_member_id_key" ON "expense_exclusions"("expense_id", "excluded_member_id");
CREATE INDEX "expense_splits_expense_id_idx" ON "expense_splits"("expense_id");
CREATE INDEX "expense_splits_debtor_member_id_is_settled_idx" ON "expense_splits"("debtor_member_id", "is_settled");
CREATE INDEX "balance_snapshots_house_id_created_at_idx" ON "balance_snapshots"("house_id", "created_at");
CREATE INDEX "balance_snapshot_entries_snapshot_id_idx" ON "balance_snapshot_entries"("snapshot_id");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "house_members" ADD CONSTRAINT "house_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "house_members" ADD CONSTRAINT "house_members_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "absences" ADD CONSTRAINT "absences_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "house_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "absences" ADD CONSTRAINT "absences_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "regular_expense_templates" ADD CONSTRAINT "regular_expense_templates_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "regular_expense_templates" ADD CONSTRAINT "regular_expense_templates_responsible_member_id_fkey" FOREIGN KEY ("responsible_member_id") REFERENCES "house_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "rotational_expense_types" ADD CONSTRAINT "rotational_expense_types_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payer_member_id_fkey" FOREIGN KEY ("payer_member_id") REFERENCES "house_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "regular_expense_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_rotational_type_id_fkey" FOREIGN KEY ("rotational_type_id") REFERENCES "rotational_expense_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expense_exclusions" ADD CONSTRAINT "expense_exclusions_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expense_exclusions" ADD CONSTRAINT "expense_exclusions_excluded_member_id_fkey" FOREIGN KEY ("excluded_member_id") REFERENCES "house_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_debtor_member_id_fkey" FOREIGN KEY ("debtor_member_id") REFERENCES "house_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "balance_snapshots" ADD CONSTRAINT "balance_snapshots_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "balance_snapshots" ADD CONSTRAINT "balance_snapshots_trigger_member_id_fkey" FOREIGN KEY ("trigger_member_id") REFERENCES "house_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "balance_snapshots" ADD CONSTRAINT "balance_snapshots_absence_id_fkey" FOREIGN KEY ("absence_id") REFERENCES "absences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "balance_snapshot_entries" ADD CONSTRAINT "balance_snapshot_entries_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "balance_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "balance_snapshot_entries" ADD CONSTRAINT "balance_snapshot_entries_creditor_member_id_fkey" FOREIGN KEY ("creditor_member_id") REFERENCES "house_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "balance_snapshot_entries" ADD CONSTRAINT "balance_snapshot_entries_debtor_member_id_fkey" FOREIGN KEY ("debtor_member_id") REFERENCES "house_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
