# Church Attendance App — Implementation Plan

_Use with the PRD (v1.1) and the Implementation Document. The product design is the same; only the way you drive the agent changes. Antigravity's menu names can change between versions, so check them against your install._

## 1. What changes compared with the Copilot plan

The app, data models, GraphQL schema and slices are identical. What differs is how you work with the agent:

- Antigravity is agent-first. It plans in documents (a task list and an implementation plan) that you review before it edits code.
- It can run the app and test it in a browser, then show you screenshots or a recording as proof.
- Rules and workflows live in the repo, so the agent follows your conventions every time.

Because the check-in flow is a web page opened from a QR link, the browser agent is very useful here: it can open `/checkin/<serviceId>?t=<token>` directly and test the Present button for you.

## 2. One-time setup

1. Create the repo and add `PRD.md` and `IMPLEMENTATION.md` (the same files used for Copilot).
2. Add the rules file from section 4 so the agent knows the product rules.
3. Add the two workflow files from section 5.
4. Put the Stitch screens or screenshots in a `/design` folder (one file per screen, named like `04-checkin-page.png`).
5. Open the repo in Antigravity as the workspace.
6. Set the agent to **Planning** mode (plan first, then act), not the fast mode, for every slice that touches data or auth.
7. Set the review policy so the agent **asks you to review** plans and risky actions. Avoid the "always proceed" and turbo terminal settings while you are learning.
8. Install the Chrome extension Antigravity asks for, so the browser agent can drive a real browser.

## 3. The working loop for every slice

1. **Prompt** with one slice (section 6).
2. **Read the plan.** The agent produces a task list and an implementation plan. Read both. Add comments or edit before approving. Reject plans that add libraries or files you did not expect.
3. **Approve** and let it implement.
4. **Review the diff** file by file. Do not accept what you cannot read.
5. **Verify** with the browser agent (section 7) and read the walkthrough it writes.
6. **Explain it back** in your own words, then ask the agent to fill the gaps.
7. **Commit** on a branch named after the slice, for example `slice-4-present-button`.
8. Start a **new conversation** for the next slice so the context stays clean. The repo files carry the memory.

## 4. Rules file (workspace rule, always on)

Save as `.agent/rules/church-app.md`. If your version reads `GEMINI.md` or `AGENTS.md` instead, put the same text there.

```
# Church Attendance & Member Profile App — project rules

Read PRD.md and IMPLEMENTATION.md before planning any work.

Stack: Next.js (App Router), React, TypeScript (strict), Tailwind, Node.js, Express,
Apollo Server (GraphQL), MongoDB + Mongoose, Zod, JWT in HTTP-only cookies.

Product rules
- There is NO personal QR code per member. The usher/admin displays ONE QR per service.
- The QR is a URL: /checkin/<serviceId>?t=<token>. Members scan it with the phone's own camera.
- The member logs in if needed, sees a welcome page with their name, and taps Present.
- Attendance is recorded for the logged-in session user only, never a member ID sent by the client.
- Tokens are signed, expire in about 5 minutes, and hold no personal data.
- Streaks count consecutive services of the same type; closeService resets members who missed it.
- Photos expire after 7 days: filter by expiresAt AND delete the stored file.

Engineering rules
- Strict TypeScript, no `any`. Explicit return types on exported functions.
- Resolvers stay thin; business logic lives in src/services.
- Validate all inputs with Zod. Normalize phone numbers to +234.
- Enforce roles on the server with requireRole().
- Never expose passwordHash or a service qrSecret in GraphQL.
- One attendance record per (service, member), enforced by a unique index.
- Mobile-first UI. Tap targets at least 48px, Present button at least 56px, text at least 16px.
- Handle loading, empty, error and offline states on every screen.
- Follow the screens in /design when building UI.
- Do not add dependencies without asking.

Working style
- Work one slice at a time. Produce a plan first and wait for approval.
- After implementing, explain the flow in plain language and list manual tests.
```

## 5. Workflows (slash commands)

Save these in `.agent/workflows/`. They are reusable prompts you trigger by name.

**`slice.md`**

```
We are working on slice $SLICE from IMPLEMENTATION.md section 10.
1. Read PRD.md, IMPLEMENTATION.md and the project rules.
2. Write a task list and an implementation plan: files to create or change, data flow,
   edge cases, and how we will test it. Do not write code yet.
3. Wait for my approval.
4. After approval, implement on a new branch named after the slice.
5. Finish with a walkthrough: what changed, how it works, and how to test it.
```

**`explain.md`**

```
Explain the slice we just built as if teaching a beginner. Walk the request path from
the browser to the database and back. Then ask me three questions to check that I
understood, and wait for my answers.
```

## 6. Slice prompts

For each slice, either run `/slice` and give the slice number, or paste the prompt below.

**Slice 0 — Setup.** Set up the monorepo with `apps/web` (Next.js, TypeScript, Tailwind, Apollo Client) and `apps/api` (Express, Apollo Server, Mongoose). Add ESLint, Prettier, env examples and a `ping` query. Plan first. Done when the web app shows the `ping` result.

**Slice 1 — Auth and roles.** Implement the User model, register, login, logout, `me`, cookie JWT, `requireRole` and role-based redirects. Plan first and list the security checks. Done when member, usher and admin land on different screens and a member cannot call admin mutations.

**Slice 2 — Profile, departments, activities.** Profile page and edit form, department and activity CRUD for admins, member assignment and member ID generation. Done when a profile shows department and activity chips.

**Slice 3 — Services and service QR.** Implement the Service model with open and close, token signing and verification, `serviceQr`, the usher Show QR screen with a 60-second refresh and projector mode, the `/checkin/[serviceId]` route with login redirect and return, `checkinPreview` and the welcome page. Follow `/design`. Done when scanning the usher QR with a phone camera opens the welcome page with the member's name.

**Slice 4 — Present button and live list.** Implement `markPresent` with all server checks, the unique index, success and other states, the live usher list (start with 5-second polling, then try subscriptions), manual search and guest entry. Done when a member taps Present, the usher list shows them within seconds, and a second tap says already marked.

**Slice 5 — Streaks and reports.** Implement the streak service, the reset in `closeService`, the member Streak screen with calendar and badges, and the reports and CSV export. Write unit tests for the streak rules first. Done when a hand-counted example of five services matches the app.

**Slice 6 — Photos with 7-day expiry.** Upload endpoint, albums, gallery, viewer with days-left badge, download, cron cleanup and query filtering. Done when a photo with a past `expiresAt` disappears from the app and from storage.

**Slice 7 — Guests, polish, PWA.** Empty, loading, error and offline states, PWA manifest and icons, optional location check, accessibility pass.

**Slice 8 — SMS or WhatsApp code (optional).** Check-in code model, request and verify mutations, provider integration, expiry and rate limits.

**Slice 9 — Tests and deploy.** Tests for attendance rules, role guards, token expiry and photo expiry. Seed script with an admin, an usher and a few members. Deploy.

## 7. Using the browser agent to test the check-in flow

After slices 3 and 4, give this verification prompt:

```
Start the web and API apps. Using the browser, test this flow and show me screenshots:
1. Log in as the usher, open a service, and open the Show QR screen. Copy the check-in URL.
2. In a private window, open that URL while logged out. Confirm it redirects to login and returns to the welcome page after login.
3. Confirm the welcome page shows the member's name and the Present button.
4. Tap Present. Confirm the success state and that the usher list shows the member.
5. Open the same URL again. Confirm the "already marked" state.
6. Wait for the token to expire (or edit its time in a test) and confirm the expired message.
7. Close the service and confirm the "not open" state.
Report anything that fails.
```

The agent cannot use a real phone camera, so it tests by opening the URL. Do one real test yourself on a phone with the app deployed or exposed through a tunnel.

## 8. Safety settings and habits

- Keep secrets (`.env`, API keys, database URL) out of prompts. Use a `.env.example` in the repo.
- Keep the terminal policy cautious. Never let the agent run destructive commands against your production database.
- Use a separate MongoDB database for development.
- Use one branch per slice and merge only after you have read the diff.
- If the agent drifts from the rules, stop it and point to the rule that it broke. Do not keep correcting by chat alone; fix the rules file so the next slice benefits.

## 9. Using Copilot and Antigravity together

You can, but not on the same branch at the same time. A simple split: let one agent build a slice, and use the other to review the diff and write tests. Keep one `IMPLEMENTATION.md` as the single source of truth so both follow the same plan.
