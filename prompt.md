You are a senior full-stack developer and UI/UX designer. 
Build a complete, responsive, production-ready web application 
called "EduPlay" — a white-label SaaS platform for language 
learning, targeted at educators and content creators who want 
to build and sell interactive language learning games and courses.

================================================================
TECH STACK
================================================================

Frontend:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui component library
- Framer Motion (animations)
- Recharts (analytics charts)
- React Hook Form + Zod (form validation)
- Zustand (state management)

Backend:
- Next.js API routes (REST)
- Prisma ORM
- PostgreSQL database
- NextAuth.js (authentication)
- Stripe (subscriptions + marketplace payments)
- AWS S3 or Cloudinary (media uploads)
- Resend or Nodemailer (emails)

Deployment-ready:
- Environment variables via .env
- Prisma migrations
- Vercel-ready configuration

================================================================
DATABASE SCHEMA (Prisma)
================================================================

Generate the full prisma/schema.prisma with these models:

User {
  id, email, password (hashed), name, avatar, role 
  (SUPER_ADMIN | EDUCATOR | STUDENT), createdAt, updatedAt
}

EducatorProfile {
  id, userId, brandName, brandLogo, primaryColor, 
  accentColor, customDomain, subscriptionPlan 
  (FREE | STARTER | PRO | SCHOOL), stripeCustomerId, 
  stripeSubscriptionId, monthlyRevenue, createdAt
}

Course {
  id, title, description, language, level (A1-C2), 
  coverImage, price, isPublished, isMarketplace, 
  educatorId, createdAt, updatedAt
}

Lesson {
  id, courseId, title, order, type, content, createdAt
}

VocabularySet {
  id, educatorId, name, language, createdAt
}

VocabularyItem {
  id, setId, word, translation, audioUrl, imageUrl, 
  exampleSentence, createdAt
}

Game {
  id, educatorId, title, type 
  (FLASHCARD | FILL_BLANK | DRAG_DROP | QUIZ | 
  DICTATION | MEMORY | SPEED_ROUND | STORY), 
  vocabularySetId, settings (JSON), isPublished, 
  price, createdAt
}

Class {
  id, educatorId, name, language, level, inviteCode, 
  createdAt
}

ClassMember {
  id, classId, studentId, joinedAt
}

Assignment {
  id, classId, gameId, dueDate, createdAt
}

StudentProgress {
  id, studentId, gameId, score, timeTaken, 
  completedAt, xpEarned
}

StudentXP {
  id, studentId, totalXP, level, streak, 
  lastActiveDate
}

Badge {
  id, name, description, iconUrl, condition
}

StudentBadge {
  id, studentId, badgeId, earnedAt
}

MarketplacePurchase {
  id, buyerId, courseId, gameId, amount, 
  stripePaymentId, createdAt
}

Subscription {
  id, educatorId, plan, status, stripeId, 
  currentPeriodEnd, createdAt
}

================================================================
AUTHENTICATION
================================================================

Use NextAuth.js with these providers:
- Email + password (credentials)
- Google OAuth

Roles and access:
- SUPER_ADMIN: access to /admin/* routes only
- EDUCATOR: access to /dashboard/* routes
- STUDENT: access to /learn/* routes

On registration, ask the user:
"I am a: Teacher / Content Creator / Both"
All three map to EDUCATOR role.
Store their choice in EducatorProfile.

Protected routes middleware using NextAuth middleware.js

================================================================
DESIGN SYSTEM AND STYLE
================================================================

Color palette:
--primary: #7F77DD (purple)
--primary-dark: #534AB7
--primary-light: #EEEDFE
--accent: #1D9E75 (teal)
--accent-light: #E1F5EE
--background: #F9F9F7
--card: #FFFFFF
--text-primary: #1A1A2E
--text-secondary: #6B7280
--warning: #EF9F27 (XP and streak amber)
--error: #E24B4A
--border: #E5E7EB

Typography:
- Headings: Plus Jakarta Sans (700, 600)
- Body: Inter (400, 500)
- Import both from Google Fonts

Border radius: 
- Cards: 12px
- Buttons: 8px
- Pills/badges: 999px

Shadows:
- Card: 0 1px 3px rgba(0,0,0,0.06)
- Hover: 0 4px 12px rgba(0,0,0,0.10)

Spacing system: Tailwind default (4px base)

Responsive breakpoints:
- Mobile: < 768px — single column, bottom tab nav
- Tablet: 768–1023px — 2 col, collapsible sidebar
- Desktop: 1024px+ — fixed sidebar 240px, 3 col grids

Animation:
- Page transitions: Framer Motion fade + slide up
- Game correct answer: green flash + confetti burst
- Game wrong answer: red shake animation
- XP gain: number flies up animation
- Level up: full screen celebration overlay

================================================================
PAGES AND ROUTES STRUCTURE
================================================================

PUBLIC ROUTES:

/ — Landing page
  - Navbar: logo, Features, Pricing, Marketplace, 
    Login, Get Started
  - Hero: headline, subtitle, CTA buttons, 
    app mockup floating card right side
  - Features section: 6 feature cards grid
  - How it works: 3 step visual flow
  - Testimonials: educator quotes carousel
  - Pricing section: 3 plan cards with toggle 
    monthly/annual
  - Footer: links, social, copyright

/pricing — Full pricing page
  - Starter $19/mo: 50 students, basic games, 
    your branding
  - Pro $49/mo: unlimited students, white-label, 
    custom domain, all games, analytics
  - School $199/mo: multi-teacher, LMS ready, 
    priority support
  - Annual toggle: 20% off
  - FAQ accordion below cards

/marketplace — Public browse
  - Filter bar: language, type, price, level
  - Course and game cards grid
  - Each card: cover, title, creator, rating, 
    price, students count
  - Featured / editor picks row at top

/auth/login — Login page
  - Email + password form
  - Google sign in button
  - Link to register

/auth/register — Registration page
  - Name, email, password fields
  - Role selector: Teacher / Content Creator / Both
  - Google sign in
  - Redirects to /dashboard after register

================================================================
EDUCATOR ROUTES (/dashboard):

/dashboard — Main dashboard
  - Welcome header with name and date
  - Stats row: Total Students, Active Classes, 
    Games Published, Monthly Revenue
  - My classes list with quick actions
  - Quick action cards: Create Course, Build Game, 
    View Reports, Customize Brand
  - Recent activity feed

/dashboard/courses — Course list
  - Grid of course cards with status badges
  - Create new course button
  - Filter and search

/dashboard/courses/new — Course builder
  - Multi-step form: 
    Step 1: Title, description, language, level, 
    cover image upload
    Step 2: Add lessons (drag-drop reorder)
    Step 3: Attach vocabulary sets and games
    Step 4: Pricing and publish settings

/dashboard/courses/[id] — Edit course
  - Same builder pre-filled

/dashboard/games — Game list
  - Cards showing game type, vocabulary set, 
    play count, publish status
  - Create new game button

/dashboard/games/new — Game builder
  - Three-panel layout:
    Left: vocabulary items list
    Center: game type selector tabs + live preview
    Right: game settings panel
  - Game types: Flashcard, Fill-in-blank, 
    Drag-drop, Quiz, Dictation, Memory, 
    Speed round, Story
  - Settings: difficulty, timer, hints, 
    audio autoplay, shuffle
  - Preview and Publish buttons

/dashboard/games/[id] — Edit game

/dashboard/vocabulary — Vocabulary sets
  - List of sets with word count
  - Create new set
  - Add words with translation, audio upload, 
    image, example sentence

/dashboard/classes — Classes list
  - Class cards: name, student count, 
    last active, manage button
  - Create class button

/dashboard/classes/new — Create class
  - Name, language, level, description

/dashboard/classes/[id] — Class detail
  - Student roster with progress overview
  - Assignments tab: list with due dates and 
    completion rates
  - Assign game button → select game + due date
  - Announcements tab
  - Live session button → launches game for 
    whole class in real time
  - Leaderboard tab: weekly XP ranking

/dashboard/analytics — Analytics dashboard
  - Class performance overview charts
  - Most missed words table
  - Student engagement rate per game (bar chart)
  - Time spent per student (line chart)
  - Export to CSV and PDF buttons

/dashboard/marketplace — Educator marketplace tab
  - My published content tab: 
    list of published courses/games, 
    sales count, revenue per item
  - Browse tab: same as public marketplace
  - Earnings summary: total revenue, 
    pending payout, Stripe Connect status

/dashboard/branding — White-label settings
  - Two-column layout:
    Left form: app name, tagline, logo upload, 
    primary color picker, accent color picker, 
    custom domain input + verify button
  - Right: live phone frame preview updating 
    in real time as settings change
  - Save button

/dashboard/settings — Account settings
  - Profile info, password change, 
    notification preferences, delete account

/dashboard/billing — Subscription management
  - Current plan display
  - Upgrade / downgrade buttons
  - Billing history table
  - Cancel subscription option

================================================================
STUDENT ROUTES (/learn):

/learn — Student home
  - Daily streak banner
  - XP progress bar to next level
  - Assigned games to-do list with due dates
  - Continue learning: last played game
  - Free practice section: browse all available games

/learn/game/[id] — Game play screen
  This is the most important screen.
  Implement all 8 game types:

  FLASHCARD:
  - Card flip animation (front: word, back: translation)
  - Audio play button
  - Know it / Don't know it buttons
  - Progress through set

  FILL_BLANK:
  - Sentence with blank shown
  - 4 answer options as buttons
  - Green flash correct, red shake wrong
  - Explanation shown after wrong answer

  DRAG_DROP:
  - Scrambled word tiles
  - Drop zone for assembling sentence
  - Check button

  QUIZ:
  - Question text
  - 4 multiple choice options
  - Timed countdown ring (30 seconds)
  - Immediate feedback

  DICTATION:
  - Audio plays automatically
  - Text input for student to type what they hear
  - Speed control: 0.75x 1x 1.25x
  - Submit and check

  MEMORY:
  - Grid of face-down cards
  - Flip two at a time to match pairs
  - Match counter and time tracker

  SPEED_ROUND:
  - Fast true/false questions
  - Countdown timer 60 seconds
  - XP multiplier for streak of correct answers

  STORY:
  - Short paragraph with multiple blanks
  - Fill all blanks then submit full story

  After every game:
  - Results screen: score, XP earned, 
    time taken, accuracy percentage
  - Confetti animation if score > 80%
  - Level up overlay if XP threshold crossed
  - Buttons: Play again, Next game, Back to home

/learn/progress — Student progress dashboard
  - Streak calendar heatmap (30 days)
  - Skills radar chart: 
    Vocabulary, Grammar, Listening, 
    Speaking, Writing
  - XP history line chart (7 days)
  - Words learned count and list
  - Badges earned grid
  - Level and XP bar

/learn/classes — Student classes list
  - Cards for each class joined
  - Join new class with invite code input

/learn/profile — Student profile
  - Avatar, name, stats summary
  - Edit profile form

================================================================
ADMIN ROUTES (/admin):

/admin — Admin overview
  - Platform stats: total users, 
    MRR, active subscriptions, churn rate
  - Recent signups table
  - Revenue chart (30 days line chart)

/admin/users — All users table
  - Filter by role, plan, date
  - Search by name or email
  - Click user to view detail
  - Grant/revoke access manually

/admin/subscriptions — Subscriptions list
  - Active, cancelled, trialing tabs
  - MRR breakdown by plan
  - Failed payments list

/admin/marketplace — Marketplace moderation
  - Pending approval queue
  - Approved and rejected content lists
  - Approve/reject with reason

/admin/settings — Platform configuration
  - Revenue share percentage setter
  - Promo code creator
  - Email template editor

================================================================
COMPONENTS TO BUILD
================================================================

Layout components:
- <Navbar /> — public, responsive with mobile menu
- <Sidebar /> — dashboard, collapsible, role-aware
- <BottomNav /> — mobile student navigation
- <Footer /> — public pages

UI components (extend shadcn/ui):
- <StatCard /> — icon, value, label, trend arrow
- <CourseCard /> — cover, title, meta, actions
- <GameCard /> — type badge, title, play count, status
- <ClassCard /> — name, students, progress
- <BadgeCard /> — icon, name, earned/locked state
- <ProgressBar /> — label, value, color variant
- <XPBar /> — current XP, next level threshold
- <StreakBadge /> — flame icon, days count
- <SkillsRadar /> — recharts radar chart
- <ActivityHeatmap /> — calendar grid component
- <ColorPicker /> — hex input + visual picker
- <LogoUpload /> — drag drop with preview
- <PhonePreview /> — branded phone frame mockup
- <LiveSessionBanner /> — real-time class game launcher
- <ConfettiOverlay /> — canvas confetti on win
- <LevelUpModal /> — full screen level celebration

Game components:
- <FlashcardGame />
- <FillBlankGame />
- <DragDropGame />
- <QuizGame />
- <DictationGame />
- <MemoryGame />
- <SpeedRoundGame />
- <StoryGame />
- <GameResultScreen />
- <GameProgressBar />
- <HeartBar /> — lives display

================================================================
API ROUTES TO BUILD
================================================================

Auth:
POST /api/auth/[...nextauth]

Courses:
GET    /api/courses
POST   /api/courses
GET    /api/courses/[id]
PUT    /api/courses/[id]
DELETE /api/courses/[id]
POST   /api/courses/[id]/publish

Games:
GET    /api/games
POST   /api/games
GET    /api/games/[id]
PUT    /api/games/[id]
DELETE /api/games/[id]
POST   /api/games/[id]/publish
POST   /api/games/[id]/play — saves progress + XP

Vocabulary:
GET    /api/vocabulary
POST   /api/vocabulary
GET    /api/vocabulary/[id]
PUT    /api/vocabulary/[id]
DELETE /api/vocabulary/[id]
POST   /api/vocabulary/[id]/items — add words

Classes:
GET    /api/classes
POST   /api/classes
GET    /api/classes/[id]
PUT    /api/classes/[id]
DELETE /api/classes/[id]
POST   /api/classes/[id]/join — student joins by code
GET    /api/classes/[id]/students
POST   /api/classes/[id]/assign — assign game
POST   /api/classes/[id]/live — start live session

Progress:
GET    /api/progress/[studentId]
POST   /api/progress — save game result
GET    /api/progress/[studentId]/xp
GET    /api/progress/[studentId]/badges

Branding:
GET    /api/branding
PUT    /api/branding
POST   /api/branding/domain/verify

Billing:
GET    /api/billing/plans
POST   /api/billing/subscribe
POST   /api/billing/cancel
GET    /api/billing/history
POST   /api/billing/webhook — Stripe webhook

Marketplace:
GET    /api/marketplace
GET    /api/marketplace/[id]
POST   /api/marketplace/purchase
GET    /api/marketplace/my-sales

Admin:
GET    /api/admin/stats
GET    /api/admin/users
PUT    /api/admin/users/[id]
GET    /api/admin/subscriptions
GET    /api/admin/marketplace/pending
POST   /api/admin/marketplace/[id]/approve
POST   /api/admin/marketplace/[id]/reject

Upload:
POST   /api/upload/image
POST   /api/upload/audio

================================================================
STRIPE INTEGRATION
================================================================

Subscription plans:
- price_starter: $19/month or $182/year
- price_pro: $49/month or $470/year
- price_school: $199/month or $1910/year

Marketplace:
- Use Stripe Connect for creator payouts
- Platform takes 25% revenue share
- Creators keep 75%
- Monthly automatic payout via Stripe Connect

Webhooks to handle:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed
- payment_intent.succeeded

================================================================
WHITE-LABEL ENGINE
================================================================

Each educator has their own brand applied to the 
student-facing /learn/* routes.

When a student visits /learn, load their class's 
educator branding:
- Replace app name with brandName
- Replace logo with brandLogo
- Apply primaryColor and accentColor as CSS variables
- If customDomain is set and verified, 
  serve the app on that domain via middleware

In middleware.ts:
- Detect custom domain from request headers
- Load educator branding from database by domain
- Inject branding as CSS custom properties
- Student never sees "EduPlay" brand if educator 
  has white-label active

================================================================
EMAIL NOTIFICATIONS
================================================================

Send these automated emails:

To students:
- Welcome email on join
- New assignment from teacher (with due date)
- Streak about to break (24h warning)
- Level up congratulations
- Badge earned notification

To educators:
- Welcome + onboarding checklist
- First student joined your class
- Subscription renewal reminder
- Marketplace sale notification
- Monthly earnings summary

================================================================
GAMIFICATION LOGIC
================================================================

XP system:
- Complete game: +10 XP base
- Perfect score: +20 XP bonus
- Speed bonus (finish fast): +5 XP
- Daily first game: +15 XP
- Streak maintained: +10 XP/day

Level thresholds:
- Level 1: 0 XP
- Level 2: 100 XP
- Level 3: 250 XP
- Level 4: 500 XP
- Each level after: previous threshold × 1.5

Streak system:
- Increment streak if student plays at least 
  one game per day
- Reset to 0 if a day is missed
- Show flame icon with day count

Badges to implement:
- First Step: complete first game
- On Fire: 7-day streak
- Unstoppable: 30-day streak
- Word Master: learn 100 words
- Perfect: get 100% on any game
- Speed Demon: finish speed round in under 30s
- Class Champion: reach #1 on class leaderboard
- Explorer: play all 8 game types

================================================================
FOLDER STRUCTURE
================================================================

/app
  /page.tsx — landing
  /pricing/page.tsx
  /marketplace/page.tsx
  /auth/login/page.tsx
  /auth/register/page.tsx
  /dashboard/layout.tsx
  /dashboard/page.tsx
  /dashboard/courses/page.tsx
  /dashboard/courses/new/page.tsx
  /dashboard/courses/[id]/page.tsx
  /dashboard/games/page.tsx
  /dashboard/games/new/page.tsx
  /dashboard/games/[id]/page.tsx
  /dashboard/vocabulary/page.tsx
  /dashboard/classes/page.tsx
  /dashboard/classes/new/page.tsx
  /dashboard/classes/[id]/page.tsx
  /dashboard/analytics/page.tsx
  /dashboard/marketplace/page.tsx
  /dashboard/branding/page.tsx
  /dashboard/settings/page.tsx
  /dashboard/billing/page.tsx
  /learn/layout.tsx
  /learn/page.tsx
  /learn/game/[id]/page.tsx
  /learn/progress/page.tsx
  /learn/classes/page.tsx
  /learn/profile/page.tsx
  /admin/layout.tsx
  /admin/page.tsx
  /admin/users/page.tsx
  /admin/subscriptions/page.tsx
  /admin/marketplace/page.tsx
  /admin/settings/page.tsx
  /api/[all routes listed above]

/components
  /layout
  /ui (extended shadcn)
  /games
  /dashboard
  /student
  /admin
  /shared

/lib
  /prisma.ts
  /auth.ts
  /stripe.ts
  /upload.ts
  /mail.ts
  /xp.ts
  /branding.ts

/prisma
  /schema.prisma
  /migrations

/middleware.ts
/.env.example

================================================================
IMPORTANT INSTRUCTIONS
================================================================

1. Generate ALL files completely — no placeholders, 
   no "// TODO", no "add your logic here" comments.
   Every function must be fully implemented.

2. All forms must have full validation using 
   React Hook Form + Zod schemas.

3. All API routes must have proper error handling, 
   authentication checks, and role-based access control.

4. All pages must be fully responsive — tested at 
   375px, 768px, 1024px, and 1440px widths.

5. Loading states: every data fetch must show a 
   skeleton loader using shadcn Skeleton component.

6. Empty states: every list/grid must have a 
   friendly empty state with illustration and CTA.

7. Toast notifications: use shadcn Toast for all 
   success, error, and info feedback.

8. All colors must use the CSS variables defined 
   in the design system — no hardcoded color values 
   in components.

9. The game play screen (/learn/game/[id]) is the 
   most critical screen — make it polished, animated, 
   and fully functional for all 8 game types.

10. Start by generating in this order:
    1. prisma/schema.prisma
    2. .env.example
    3. lib/ utility files
    4. middleware.ts
    5. Design system (globals.css + tailwind.config)
    6. Shared layout components
    7. Auth pages
    8. Dashboard pages (educator)
    9. Learn pages (student)
    10. Admin pages
    11. All API routes
    12. All game components