# RWTW Bounties — Whop App

A bounties system for your RWTW Whop community. Members complete tasks and earn real money paid directly to their Whop balance via the Whop Transfers API.

## How It Works

- **Members** see bounties in the Experience view inside your Whop, submit proof, and get paid
- **Your team** reviews submissions in the Dashboard view, approves/declines, and payouts are instant
- **Payouts** go directly from your Whop company balance to the member's Whop balance — they can withdraw via CashApp, Venmo, ACH, crypto, etc.

## Architecture

```
app/
├── experiences/[experienceId]/   ← Member view (bounty cards, submit proof)
├── dashboard/[companyId]/        ← Admin view (review, manage, create, payouts)
├── api/
│   ├── bounties/                 ← CRUD for bounties
│   ├── submissions/              ← CRUD for submissions
│   └── transfers/                ← Whop Transfers API (payouts)
components/
├── MemberBounties.tsx            ← Full member UI
├── AdminDashboard.tsx            ← Full admin UI with payout integration
lib/
├── whop-sdk.ts                   ← Whop SDK initialization
├── types.ts                      ← TypeScript types
```

## Setup

### 1. Clone & Install

```bash
pnpm create next-app@latest -e https://github.com/YOUR_REPO/rwtw-bounties my-bounties
cd my-bounties
pnpm install
```

### 2. Create a Whop App

1. Go to your [Whop Developer Dashboard](https://whop.com/dashboard/developer/)
2. Create a new app
3. In the **Hosting** section:
   - **Base URL**: Your Vercel domain (e.g. `https://rwtw-bounties.vercel.app`)
   - **App path**: `/experiences/[experienceId]`
   - **Dashboard path**: `/dashboard/[companyId]`
4. Copy your env variables

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
WHOP_API_KEY=your_api_key_here
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxxxxxxxxxxx
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_xxxxxxxxxxxxxx
```

Make sure your API key has **transfer permissions** enabled so payouts work.

### 4. Add a Database

The current version uses in-memory storage for demo purposes. For production, swap in your preferred database:

- **Supabase** (recommended — free tier, PostgreSQL)
- **PlanetScale** (MySQL)
- **Vercel KV** (Redis)

Replace the in-memory arrays in `/api/bounties/route.ts` and `/api/submissions/route.ts` with database queries.

### 5. Install in Your Whop

1. Go to your RWTW Whop community
2. Navigate to **Tools** section
3. Add your bounties app
4. Members will see it in their experience, your team in the dashboard

### 6. Deploy to Vercel

```bash
# Push to GitHub, then:
vercel --prod
```

Add your `.env.local` variables in the Vercel dashboard under Environment Variables.

## Payout Flow

When an admin clicks **Approve**:

1. Frontend calls `POST /api/transfers`
2. Server calls Whop Transfers API:
   ```js
   whopsdk.transfers.create({
     amount: 5,
     currency: 'usd',
     destination_id: 'user_xxxxx',    // member
     origin_id: 'biz_xxxxx',          // your RWTW company
     notes: 'Bounty: Like, Comment & Repost',
     idempotence_key: 'bounty-sub_123', // prevents double pay
   })
   ```
3. Money transfers instantly from your balance to their Whop balance
4. Submission is marked as approved with the transfer ID
5. Member can withdraw via CashApp, Venmo, ACH, crypto, etc.

## Local Development

```bash
pnpm dev
```

Then in your Whop app settings, click the settings icon and select "localhost" to test in the iframe.

## Tech Stack

- **Next.js 15** (App Router)
- **Whop SDK** (`@whop/sdk`)
- **Tailwind CSS**
- **Vercel** (hosting)
