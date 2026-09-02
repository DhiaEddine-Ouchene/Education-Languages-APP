# Chargily Pay Integration Setup

## ✅ Completed Backend Implementation

### 1. Database Schema (✅ Applied via `prisma db push`)
- Added `PaymentProvider` enum (LEMONSQUEEZY, CHARGILY)
- Added fields to `EducatorProfile`:
  - `paymentProvider: PaymentProvider?`
  - `chargilyCustomerId: String?`
- Added fields to `Subscription`:
  - `paymentProvider: PaymentProvider @default(LEMONSQUEEZY)`
  - `chargilyCheckoutId: String?`
- Added indexes for performance

### 2. Pricing Configuration (`lib/chargily.ts`)
- Pro Plan: 1,600 DA/month, 13,300 DA/year
- Ultimate Plan: 2,950 DA/month, 24,000 DA/year
- Helper functions: `formatDZD()`, `getPlanFromChargilyPrice()`, `isChargilyConfigured()`

### 3. Webhook Handler (`app/api/webhooks/chargily/route.ts`)
- HMAC-SHA256 signature verification
- Handles `checkout.paid`, `checkout.failed`, `checkout.canceled` events
- Extracts `educatorId` from metadata
- Maps price IDs to plans
- Calculates `currentPeriodEnd` (30 or 365 days)
- Updates both `EducatorProfile` and `Subscription` atomically

### 4. Subscription Expiry Checker (`lib/subscription-checker.ts`)
- Finds expired Chargily subscriptions
- Downgrades educators to FREE plan
- Marks subscriptions as CANCELLED
- Returns array of downgraded educator IDs
- TODO: Email notifications (commented out)

### 5. Cron Job (`app/api/cron/check-subscriptions/route.ts`)
- Daily execution at midnight UTC (configured in `vercel.json`)
- Bearer token authentication via `CRON_SECRET`
- Calls `checkExpiredSubscriptions()`
- Returns downgraded count and IDs

### 6. Billing UI (`components/dashboard/BillingClient.tsx`)
- USD/DZD payment method toggle (visible when Chargily is configured)
- Shows DZD pricing for Pro/Ultimate plans
- Opens Chargily Payment Links in new tab
- API endpoint: `app/api/billing/chargily-link/route.ts` (appends educatorId as metadata)

### 7. Environment Variables (`.env.example`)
```bash
CHARGILY_API_KEY=""
CHARGILY_API_SECRET_KEY=""

CHARGILY_LINK_PRO_MONTHLY=""
CHARGILY_LINK_PRO_YEARLY=""
CHARGILY_LINK_ULTIMATE_MONTHLY=""
CHARGILY_LINK_ULTIMATE_YEARLY=""

CHARGILY_PRICE_PRO_MONTHLY=""
CHARGILY_PRICE_PRO_YEARLY=""
CHARGILY_PRICE_ULTIMATE_MONTHLY=""
CHARGILY_PRICE_ULTIMATE_YEARLY=""

CRON_SECRET="generate-random-secret-for-cron-auth"
```

## 📋 Manual Setup Steps Required

### Step 1: Get Chargily API Keys
1. Log into [Chargily Dashboard](https://pay.chargily.com/dashboard)
2. Go to Settings → API
3. Copy `API_KEY` and `API_SECRET_KEY`
4. Add to `.env`:
   ```bash
   CHARGILY_API_KEY="your-api-key"
   CHARGILY_API_SECRET_KEY="your-secret-key"
   ```

### Step 2: Create Payment Links in Chargily Dashboard
**IMPORTANT:** Chargily does NOT support recurring subscriptions via API. Payment Links must be created manually.

For each plan+interval combination:

1. Go to Chargily Dashboard → Payment Links → Create New
2. Configure:
   - **Amount**: 
     - Pro Monthly: 1,600 DA
     - Pro Yearly: 13,300 DA
     - Ultimate Monthly: 2,950 DA
     - Ultimate Yearly: 24,000 DA
   - **Name**: "EduPlay Pro - Monthly" (or appropriate)
   - **Description**: Clear description for user
   - **Collect billing info**: ✅ Enable
   - **Metadata**: Not needed (we append it via URL parameter)
3. Save and copy the Payment Link URL (format: `https://pay.chargily.net/test/payment-links/{id}`)
4. Add to `.env`:
   ```bash
   CHARGILY_LINK_PRO_MONTHLY="https://pay.chargily.net/test/payment-links/xxx"
   CHARGILY_LINK_PRO_YEARLY="https://pay.chargily.net/test/payment-links/yyy"
   CHARGILY_LINK_ULTIMATE_MONTHLY="https://pay.chargily.net/test/payment-links/zzz"
   CHARGILY_LINK_ULTIMATE_YEARLY="https://pay.chargily.net/test/payment-links/www"
   ```

### Step 3: Get Price IDs
1. In Chargily Dashboard, go to Products
2. Create products if needed (Pro, Ultimate)
3. Copy the Price ID for each product/interval
4. Add to `.env`:
   ```bash
   CHARGILY_PRICE_PRO_MONTHLY="01xxx"
   CHARGILY_PRICE_PRO_YEARLY="01yyy"
   CHARGILY_PRICE_ULTIMATE_MONTHLY="01zzz"
   CHARGILY_PRICE_ULTIMATE_YEARLY="01www"
   ```

### Step 4: Configure Webhook
1. Go to Chargily Dashboard → Settings → Webhooks
2. Add new webhook endpoint:
   - **URL**: `https://your-domain.com/api/webhooks/chargily`
   - **Events**: Select `checkout.paid`, `checkout.failed`, `checkout.canceled`
3. The webhook secret is your `CHARGILY_API_SECRET_KEY` (already in `.env`)

### Step 5: Set Cron Secret
Generate a random secret for authenticating cron requests:
```bash
# Generate with:
openssl rand -base64 32

# Add to .env:
CRON_SECRET="your-random-secret"
```

### Step 6: Test in Chargily Test Mode
1. Ensure all URLs use `/test/` path
2. Use test card numbers from Chargily docs
3. Verify webhook receives events
4. Check educator is upgraded in database
5. Test subscription expiry by manually setting `currentPeriodEnd` to past date and triggering cron

### Step 7: Go Live
1. Switch to production API keys in Chargily Dashboard
2. Update Payment Links to production URLs (remove `/test/`)
3. Update `.env` with production credentials
4. Redeploy application

## 🔍 How It Works

### Payment Flow
1. Algerian educator clicks "🇩🇿 DZD (EDAHABIA/CIB)" toggle
2. Prices update to show DZD amounts
3. Educator clicks "Upgrade to Pro" → opens Chargily Payment Link in new tab
4. Payment Link URL includes `?metadata[educatorId]={id}` parameter
5. Educator completes payment with EDAHABIA or CIB card
6. Chargily sends `checkout.paid` webhook to our API
7. Webhook handler:
   - Verifies HMAC signature
   - Extracts `educatorId` from metadata
   - Maps price to plan (Pro/Ultimate)
   - Calculates expiry date (30 or 365 days)
   - Updates `EducatorProfile.subscriptionPlan` and `Subscription` table
8. Educator is now upgraded

### Subscription Expiry Flow
1. Vercel Cron triggers `/api/cron/check-subscriptions` daily at midnight UTC
2. Cron authenticates with `Bearer ${CRON_SECRET}`
3. Queries all active Chargily subscriptions where `currentPeriodEnd < now`
4. For each expired subscription:
   - Downgrades educator to FREE
   - Marks subscription as CANCELLED
   - Logs educator email and expiry date
   - TODO: Sends expiry notification email
5. Returns list of downgraded educator IDs

## ⚠️ Important Notes

1. **No Recurring Billing**: Chargily has NO API for recurring subscriptions. Users must manually renew by clicking the Payment Link again.

2. **Manual Renewals**: Consider sending email reminders 7 days before expiry to prompt renewal.

3. **Price ID Mapping**: The webhook uses the price/amount to determine which plan was purchased. Ensure price IDs in `.env` match your Chargily Products.

4. **Signature Verification**: CRITICAL for security. Uses HMAC-SHA256 against raw request body with `CHARGILY_API_SECRET_KEY`.

5. **Metadata**: We append `educatorId` via URL parameter (`?metadata[educatorId]=xxx`). Verify Chargily passes this back in webhook.

6. **Cron Authorization**: Vercel Cron automatically adds the correct `Authorization` header. If testing locally, add `Authorization: Bearer ${CRON_SECRET}`.

## 🧪 Testing Checklist

- [ ] DZD toggle appears in billing page (requires valid Chargily config)
- [ ] Prices update correctly when switching USD ↔ DZD
- [ ] Payment Link opens in new tab with correct `educatorId` in URL
- [ ] Test payment completes successfully
- [ ] Webhook receives `checkout.paid` event
- [ ] Signature verification passes
- [ ] Educator is upgraded to correct plan
- [ ] `Subscription` table has correct `currentPeriodEnd`
- [ ] Manually set `currentPeriodEnd` to past date
- [ ] Trigger cron: `curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/check-subscriptions`
- [ ] Verify educator downgraded to FREE
- [ ] Verify subscription marked as CANCELLED

## 📧 Future Enhancements

1. **Email Notifications**: Uncomment TODO in `subscription-checker.ts` and implement:
   - Subscription expiry warning (7 days before)
   - Subscription expired notice
   - Renewal reminder with Payment Link

2. **Grace Period**: Add 3-day grace period before downgrading

3. **Admin Dashboard**: Show Chargily subscription status, renewal dates, and failed payments

4. **Renewal Tracking**: Log renewal attempts and success rates
