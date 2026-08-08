-- Remove Marketplace and Branding features (dropped from Prisma schema)

-- Drop the MarketplacePurchase table and its foreign keys
DROP TABLE IF EXISTS "MarketplacePurchase";

-- Drop marketplace columns from Course
ALTER TABLE "Course"
  DROP COLUMN IF EXISTS "price",
  DROP COLUMN IF EXISTS "isMarketplace",
  DROP COLUMN IF EXISTS "approved",
  DROP COLUMN IF EXISTS "rejectReason";

-- Drop marketplace columns from Game
ALTER TABLE "Game"
  DROP COLUMN IF EXISTS "isMarketplace",
  DROP COLUMN IF EXISTS "approved",
  DROP COLUMN IF EXISTS "rejectReason",
  DROP COLUMN IF EXISTS "price";

-- Drop branding and marketplace-earnings columns from EducatorProfile
-- (dropping "customDomain" also removes its unique index)
ALTER TABLE "EducatorProfile"
  DROP COLUMN IF EXISTS "brandName",
  DROP COLUMN IF EXISTS "brandLogo",
  DROP COLUMN IF EXISTS "primaryColor",
  DROP COLUMN IF EXISTS "accentColor",
  DROP COLUMN IF EXISTS "customDomain",
  DROP COLUMN IF EXISTS "domainVerified",
  DROP COLUMN IF EXISTS "monthlyRevenue";
