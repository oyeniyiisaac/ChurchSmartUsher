# Church Attendance & Member Profile App — project rules

Read PRD.md and IMPLEMENTATION.md before planning any work.

Stack: Next.js (App Router), React, TypeScript (strict), Tailwind, Node.js, Express,
Apollo Server (GraphQL), MongoDB + Mongoose, Zod, database-backed sessions in HTTP-only cookies.

- Serve web and API under one domain, or proxy `/graphql` through Next.js rewrites, so HTTP-only cookies work seamlessly.
- Use database-backed sessions: a cryptographically random session ID in an HTTP-only, secure cookie, with only a SHA-256 hash stored in MongoDB, a TTL index on `expiresAt`, and sessions lasting 30–90 days. Do NOT use JWT for login sessions.

Product rules

- There is NO personal QR code per member. The usher/admin displays ONE QR per service.
- The QR is a URL: `/checkin/<serviceId>?t=<token>`. Members scan it with their phone's native camera.
- QR tokens are stateless signed time slots (HMAC-SHA256, accepting current and previous time slot, ~60–120s per slot) and hold no personal data.
- If not logged in when scanning, the member logs in (or registers) and is ALWAYS returned straight to `/checkin/<serviceId>?t=<token>`.
- The welcome page greets the member by name ("Welcome to church, Isaac. Please confirm your presence in the House of your Maker."), displays service info, and provides a large Present button.
- Attendance is recorded for the logged-in session user only, never an arbitrary member ID passed by the client.
- Duplicate check-ins return ALREADY_MARKED (catch the MongoDB duplicate-key error code 11000 from the unique `(serviceId, memberId)` index).
- Streaks count consecutive services of the same service type and are computed dynamically from attendance history, not blindly incremented; `closeService` marks/resets streaks for members who missed it.
- Store all timestamps in UTC; define service day boundaries and streak calculations in `Africa/Lagos` timezone.
- Photos expire after 7 days: filter queries by `expiresAt` AND permanently delete the stored file upon expiration.

Engineering rules

- Strict TypeScript, no `any`. Explicit return types on exported functions.
- Resolvers stay thin; business logic lives in `src/services`.
- Validate all inputs with Zod. Normalize phone numbers to E.164 (`+234...`).
- Enforce roles on the server with `requireRole()`.
- Never expose `passwordHash` or a service `qrSecret` in GraphQL.
- One attendance record per `(service, member)`, strictly enforced by a unique compound index.
- Mobile-first UI. Tap targets at least 48px, Present button at least 56px, text at least 16px.
- Handle loading, empty, error and offline states on every screen.
- Follow the screens in `/design` (Stitch designs) when building UI.
- Do not add dependencies without asking.
- Write tests first for risky business logic: token expiry, duplicate check-in, and streak rules.

Architecture & Slices

- Slice 0.5 (UI Foundation): Ports design tokens and shared components from `/design`.
- Slice 1 (Auth & Roles): Includes the seed script (admin, usher, 25 members, 8 services) for realistic testing.

Working style

- Work one slice at a time. Produce a plan first and wait for approval.
- After implementing, explain the flow in plain language and list manual tests.
