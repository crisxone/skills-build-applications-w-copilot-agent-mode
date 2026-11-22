# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Implement four routed React views in `src/components` that use `src/api/client.ts` for relative `/api` requests. For every capability, show a `role="status"` loading state while fetching, display a meaningful empty-state message after a successful empty result, render the returned data in accessible markup, and expose request failures with `role="alert"`.
- **Shared API client:** Keep `VITE_API_BASE_URL` as an optional override. When it is unset, requests must use relative `/api` URLs so Vite can proxy them to Express.
- Logic tier decision: Keep Express routes thin and delegate validation and data behavior to explicit functions in `src/services/octofitService.ts`. Routes should return the established response envelopes (`{ activities }`, `{ team }`/`{ teams }`, `{ leaderboard }`, or `{ suggestions }`) and use the shared error middleware for deliberate statuses.
- Data tier decision: Enforce the fields below in Mongoose schemas and preserve `src/config/database.ts`. Seed with upserts rather than collection-wide deletion, retain unrelated users, teams, activities, and workouts, and reconcile existing seeded users and team membership across repeated runs.
- **User data:** Require `name`, `email`, and `fitnessGoal`. `team` remains an ObjectId reference; the seed may use it and must reconcile it when moving the seeded Mona fixture.
- **Team data:** Require `name` and `mascot`, default `members` to an empty array, and preserve submitted member ObjectIds in the team document. Reject a team whose `name` is missing or blank.
- Activity tracking approach: Require `user`, `team`, `type`, `minutes`, `points`, and `occurredAt`. Validate `userId`, `teamId`, `type`, and `minutes` before writing; reject malformed ObjectIds and missing user/team references with a 4xx status. Store `minutes`, set `points` equal to the submitted minutes, and set `occurredAt` to a new server timestamp.
- Team management approach: Require `name` and `mascot`, default `members` to an empty array, and preserve submitted member ObjectIds in the team document. Reject a team whose `name` is missing or blank.
- **Workout data:** Require `title`, `focus`, `minutes`, and `difficulty`.
- Leaderboard approach: Aggregate activity `points` by team, include the team name, sort totals from highest to lowest, and assign consecutive 1-based ranks.
- Workout suggestions approach: Resolve the user with an exact email match. Use the user's fitness goal first; otherwise use the most recent activity type, and map it to a matching seeded workout focus. Put the selection rationale in `reason`, including the goal or activity pattern where relevant. Return a deliberate 404 when no user matches.
- **Scope:** Do not add authentication or public API exposure. Keep MongoDB on `27017`, Express on `8000`, and Vite on `5173`.

## Test plan

Implement and verify one tier at a time. A tier is complete only when its targeted tests pass; do not implement later tiers merely to make an earlier failing test appear green.

1. **Data tier — required-model contract**
   - Command: `npm run test:data --prefix octofit-tracker/backend`
   - Baseline: 1 passed, 4 failed. The failures correspond to missing required fields in `User`, `Team`, `Activity`, and `Workout`; the idempotent seed contract passes.
   - Implement the Mongoose requirements in [octofit-tracker/backend/src/models](/workspaces/skills-build-applications-w-copilot-agent-mode/octofit-tracker/backend/src/models).
   - The passing contract must verify: meaningful user identity and goal; team name/mascot/member behavior; activity references/type/minutes/points/timestamp; workout title/focus/duration/difficulty; and repeatable seeding that retains sentinel records and reconciles the seeded Mona fixture.
   - Next gate: rerun the data command until all 5 tests pass.

2. **Logic tier — API contract**
   - Command: `npm run test:api --prefix octofit-tracker/backend`
   - Baseline: 0 passed, 4 failed. Activity and team creation return placeholder `501` responses, while leaderboard and workout suggestions use incomplete implementations.
   - Implement service behavior in [octofit-tracker/backend/src/services/octofitService.ts](/workspaces/skills-build-applications-w-copilot-agent-mode/octofit-tracker/backend/src/services/octofitService.ts), leaving routes thin.
   - The passing contract must cover: activity and team creation/listing; 400-level failures for missing or malformed activity IDs and missing teams; leaderboard sums, ordering, and ranks; exact-email workout suggestions with a 4xx response for unknown users.
   - Next gate: rerun the API command until all 4 tests pass, then run `npm run build --prefix octofit-tracker/backend`. The backend build must pass TypeScript compilation before moving to presentation work.

3. **Presentation tier — React contract**
   - Command: `npm test --prefix octofit-tracker/frontend`
   - Baseline: 0 passed, 15 failed. The capability components use placeholders and do not yet consume or render API data.
   - Implement the four routed views and shared fetch behavior in [octofit-tracker/frontend/src](/workspaces/skills-build-applications-w-copilot-agent-mode/octofit-tracker/frontend/src).
   - The passing contract must cover: API-backed activity, team, leaderboard, and workout data; a pending `role="status"` loading state for each capability; meaningful empty states; accessible `role="alert"` failures; and a workout request for `mona@example.com`.
   - Next gate: rerun the frontend command until all 15 tests pass, then run `npm run build --prefix octofit-tracker/frontend`. The frontend build must pass TypeScript and Vite production compilation.

## Smallest safe implementation order

1. Fix Mongoose required fields and defaults in the data models.
2. Preserve or repair the existing seed contract; do not clear unrelated collections.
3. Run and pass the data test command.
4. Implement explicit activity/team validation and create/list behavior in the service.
5. Implement leaderboard aggregation/ranking and exact-email workout selection.
6. Run and pass the API tests and backend build.
7. Replace the placeholder presentation components with API-backed loading, success, empty, and error states.
8. Run and pass the frontend tests and frontend build.
