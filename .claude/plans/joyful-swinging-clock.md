# Real Payment Integration with LemonSqueezy

## Context

The app currently uses a mock billing system with outdated plans (STARTER $9.99, PRO $29.99, SCHOOL $99.99) that doesn't match the new pricing model (PRO $12/mo $99/yr, ULTIMATE $22/mo $179/yr). The LemonSqueezy SDK is already installed but runs in mock mode because env vars are placeholders. This plan switches to real payment processing, updates the plan structure, and adds AI-generation enforcement for the Free tier.

**Store:** dhialabs.lemonsqueezy.com (#441853) — products need to be created.

---

## Phase A — Create LemonSqueezy Products (manual setup)

In your LemonSqueezy dashboard, create these 2 products, each with 2 variants:

### Product 1: "EduPlay Pro"
| Variant | Price | Billing |
|---|---|---|
| Pro Monthly | $12 | Monthly |
| Pro Yearly | $99 | Yearly |

### Product 2: "EduPlay Ultimate"
| Variant | Price | Billing |
|---|---|---|
| Ultimate Monthly | $22 | Monthly |
| Ultimate Yearly | $179 | Yearly |

After creation, note the 4 **Variant IDs** (numeric — visible in the dashboard URL when editing a variant). Also set a **Webhook URL** pointing to `https://yourdomain.com/api/billing/webhook` with the signing secret.

---

## Phase B — Files to Modify

### 1. `.env` — Real credentials
Replace placeholder values:
- `LEMON_SQUEEZY_API_KEY` → the key you shared (starts with `eyJ0eXAi...`)
- `LEMON_SQUEEZY_STORE_ID` → `441853`
- `LEMON_SQUEEZY_WEBHOOK_SECRET` → your webhook signing secret
- `LS_VARIANT_PRO_MONTHLY` → variant ID for Pro Monthly
- `LS_VARIANT_PRO_YEARLY` → variant ID for Pro Yearly
- `LS_VARIANT_ULTIMATE_MONTHLY` → variant ID for Ultimate Monthly
- `LS_VARIANT_ULTIMATE_YEARLY` → variant ID for Ultimate Yearly

Remove the old `LS_VARIANT_STARTER_*` and `LS_VARIANT_SCHOOL_*` vars.

### 2. `prisma/schema.prisma` — New Plan enum + AI tracking
- **Plan enum:** change from `FREE STARTER PRO SCHOOL` to `FREE PRO ULTIMATE`
- **EducatorProfile:** add `aiGenerationsThisMonth Int @default(0)` and `aiGenerationsResetAt DateTime?`
- **Subscription model:** keep as-is (plan type changes automatically)

### 3. `lib/lemonsqueezy.ts` — New plans config
- Remove STARTER and SCHOOL
- Add PRO ($12/mo, $99/yr) and ULTIMATE ($22/mo, $179/yr)
- Update `variantIdMonthly`/`variantIdYearly` to reference `LS_VARIANT_PRO_*` and `LS_VARIANT_ULTIMATE_*`
- Update `PLAN_MRR`: `{ FREE: 0, PRO: 12, ULTIMATE: 22 }`
- Update `planFromVariantId()` to return `PRO | ULTIMATE | null`

### 4. `lib/branding.ts` — White-label check
- Change white-label eligibility from `PRO || SCHOOL` to `PRO || ULTIMATE` (both paid tiers get branding)

### 5. `app/pricing/page.tsx` — New pricing display
- Change hardcoded plans to: Free ($0), Pro ($12/mo / $99/yr), Ultimate ($22/mo / $179/yr)
- Update annual badge from "Save 20%" to "Save ~31%"
- Adjust grid from 4 cols to 3 cols

### 6. `components/dashboard/BillingClient.tsx` — New billing UI
- Change plans to Pro ($12/mo) and Ultimate ($22/mo)
- Remove STARTER and SCHOOL
- Update annual discount text

### 7. `app/api/billing/subscribe/route.ts` — Updated plans
- Change Zod schema from `["STARTER", "PRO", "SCHOOL"]` to `["PRO", "ULTIMATE"]`
- Remove mock mode fallback (will always use real LS checkout now that credentials are configured)

### 8. `app/api/billing/webhook/route.ts` — Updated plan mapping
- `planFromVariantId()` already returns NEW plan keys, so minimal changes
- Verify it still handles cancellation/expiry correctly

### 9. `app/api/billing/cancel/route.ts` — No changes needed
- Works generically with any subscription ID

### 10. `app/api/admin/users/[id]/route.ts` — Admin plan selector
- Change Zod enum from `["FREE", "STARTER", "PRO", "SCHOOL"]` to `["FREE", "PRO", "ULTIMATE"]`

### 11. `components/admin/UserActions.tsx` — Admin dropdown
- Change plan options from `["FREE", "STARTER", "PRO", "SCHOOL"]` to `["FREE", "PRO", "ULTIMATE"]`

### 12. `app/admin/users/page.tsx` — Admin filter
- Change filter options from `["FREE", "STARTER", "PRO", "SCHOOL"]` to `["FREE", "PRO", "ULTIMATE"]`

### 13. `app/dashboard/branding/page.tsx` — Plan check text
- Update condition from `FREE || STARTER` to `FREE` (only Free sees the upgrade prompt)
- Update text to reference Pro and Ultimate instead of Pro and School

### 14. `app/dashboard/billing/page.tsx` — No changes needed
- Already dynamic, reads from profile

### 15. `app/admin/page.tsx` — No changes needed
- Uses `PLAN_MRR` from lib, which auto-updates

### 16. `app/admin/subscriptions/page.tsx` — No changes needed
- Uses `PLAN_MRR` from lib

---

## Phase C — New Feature: AI Generation Limit Enforcement

### 17. `lib/plan-guard.ts` — NEW file
Create a reusable guard function:
```ts
export async function checkAIGenerationLimit(educatorId: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date | null }>
```
Logic:
- Fetch educator's `subscriptionPlan`, `aiGenerationsThisMonth`, `aiGenerationsResetAt`
- If plan is PRO or ULTIMATE → always allowed
- If plan is FREE:
  - If `aiGenerationsResetAt` is null or in the past → reset counter to 0, set resetAt to end of current month
  - If count ≥ 15 → deny with 0 remaining
  - Otherwise allow with remaining = 15 - count
- Use `prisma.$transaction` for atomic read-then-update to prevent race conditions

### 18. `app/api/ai/generate/route.ts` — Add limit check
- Import `checkAIGenerationLimit` and call it after educator lookup
- If not allowed, return 429 with `{ error: "Monthly AI generation limit reached", remaining: 0, resetAt }`

### 19. `app/api/ai/vocabulary/route.ts` — Add limit check
Same guard as above — vocabulary generation also counts toward the AI limit.

---

## Phase D — Prisma Migration

After schema changes, run:
```bash
npx prisma migrate dev --name switch-to-pro-ultimate-plans
```

This generates a SQL migration that:
1. Creates new `Plan` enum type with FREE, PRO, ULTIMATE
2. Alters columns to use it, mapping: STARTER→PRO, PRO→ULTIMATE, SCHOOL→ULTIMATE
3. Drops the old enum type

---

## Phase E — Verification

1. **Start dev server:** `npm run dev`
2. **Visit `/pricing`** — confirms new plans display correctly
3. **Register as educator** — plan defaults to FREE
4. **Visit `/dashboard/billing`** — see current plan "FREE", options for Pro/Ultimate
5. **Click "Choose Pro"** — redirects to LemonSqueezy checkout URL (real, not mock)
6. **Complete test purchase** (LS provides test card mode) — redirects back to `/dashboard/billing?success=1`
7. **Check webhook** — verify subscription_created event was received, plan updated to PRO
8. **Try AI generation on Free plan** — verify it works (under 15/month)
9. **Generate 15 AI games** — verify the 16th returns 429 error
10. **Check AI on Pro plan** — verify unlimited generation works
11. **Cancel subscription** — verify webhook sets plan back to FREE
12. **Admin panel** — verify plan filter/dropdown shows PRO and ULTIMATE

---

## Files Changed Summary

| File | Change |
|---|---|
| `.env` | New credentials, 4 variant IDs |
| `prisma/schema.prisma` | Plan enum, AI tracking fields |
| `lib/lemonsqueezy.ts` | New plan config, MRR, variant mapping |
| `lib/branding.ts` | White-label on PRO/ULTIMATE |
| `lib/plan-guard.ts` | **NEW** — AI generation limit enforcement |
| `app/pricing/page.tsx` | New pricing grid |
| `components/dashboard/BillingClient.tsx` | New plan options |
| `app/api/billing/subscribe/route.ts` | New plan enum, remove mock mode |
| `app/api/billing/webhook/route.ts` | Verify LS variant IDs map correctly |
| `app/api/ai/generate/route.ts` | AI limit check |
| `app/api/ai/vocabulary/route.ts` | AI limit check |
| `app/api/admin/users/[id]/route.ts` | Updated plan enum |
| `components/admin/UserActions.tsx` | Updated plan dropdown |
| `app/admin/users/page.tsx` | Updated plan filter |
| `app/dashboard/branding/page.tsx` | Updated plan condition text |
| **Migration file** | Auto-generated by `prisma migrate dev` |
