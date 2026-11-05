# Church Attendance & Member Profile App (ChurchConnect)

A mobile-first church attendance web application and PWA. Members scan one church QR code per service, confirm their presence, track consistency streaks, and access service photos with a 7-day auto-expiry policy.

## Architecture

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind/Stitch Design Tokens
- **API**: Apollo Server 4 mounted on `/api/graphql` route handler
- **Database**: MongoDB with Mongoose
- **Auth**: Database-backed opaque sessions in HTTP-only secure cookies (no JWT for login sessions)
- **Timezone**: Dates and streak logic calculated in `Africa/Lagos`

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+ (`corepack enable`)
- MongoDB (local or Atlas)

### Local Setup

```bash
# 1. Install dependencies
corepack enable
pnpm install

# 2. Configure environment
cp .env.example .env.local

# 3. Quality & validation checks
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# 4. Run development server
pnpm dev
```

The web application runs at `http://localhost:3000`.
GraphQL operations are available at `http://localhost:3000/api/graphql`.
