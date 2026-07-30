-- Add AI generation tracking fields to EducatorProfile (safe if already exist)
ALTER TABLE "EducatorProfile"
  ADD COLUMN IF NOT EXISTS "aiGenerationsThisMonth" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "aiGenerationsResetAt" TIMESTAMP(3);

-- Update Plan enum: add new values, migrate old data, drop old values
-- Use the OID of the Plan enum type directly to avoid quoting issues

DO $$
DECLARE
  plan_type_oid OID;
  has_starter BOOLEAN;
BEGIN
  plan_type_oid := '"Plan"'::regtype::OID;

  -- Check if STARTER still exists in the enum
  SELECT EXISTS (
    SELECT 1 FROM pg_enum WHERE enumlabel = 'STARTER' AND enumtypid = plan_type_oid
  ) INTO has_starter;

  IF has_starter THEN
    -- Create new enum type
    CREATE TYPE "Plan_new" AS ENUM ('FREE', 'PRO', 'ULTIMATE');

    -- Update EducatorProfile.subscriptionPlan
    EXECUTE format(
      'ALTER TABLE "EducatorProfile" ALTER COLUMN "subscriptionPlan" TYPE "Plan_new" USING (CASE "subscriptionPlan"::text WHEN ''FREE'' THEN ''FREE'' WHEN ''STARTER'' THEN ''PRO'' WHEN ''PRO'' THEN ''ULTIMATE'' WHEN ''SCHOOL'' THEN ''ULTIMATE'' END)::text::"Plan_new"'
    );

    -- Update Subscription.plan
    EXECUTE format(
      'ALTER TABLE "Subscription" ALTER COLUMN "plan" TYPE "Plan_new" USING (CASE "plan"::text WHEN ''FREE'' THEN ''FREE'' WHEN ''STARTER'' THEN ''PRO'' WHEN ''PRO'' THEN ''ULTIMATE'' WHEN ''SCHOOL'' THEN ''ULTIMATE'' END)::text::"Plan_new"'
    );

    -- Drop old enum type and rename new one
    DROP TYPE "Plan";
    ALTER TYPE "Plan_new" RENAME TO "Plan";
  END IF;
END $$;
