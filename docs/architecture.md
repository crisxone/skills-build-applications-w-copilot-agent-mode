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

- Presentation tier decision: Implement four routed React views that use `src/api/client.ts` for relative `/api` requests. Each view will announce loading, render success or empty data, and expose API failures as accessible alerts.
- Logic tier decision: Keep Express routes thin and delegate validation and data behavior to explicit functions in `src/services/octofitService.ts`. Invalid IDs, missing references, and unknown resources will return deliberate 4xx responses rather than Mongoose cast errors or 5xx responses.
- Data tier decision: Enforce required fields and references in Mongoose schemas and preserve the shared database configuration. Keep the seed as an idempotent upsert-based operation that retains unrelated data and reconciles a seeded user's team membership.
- Activity tracking approach: Validate `userId`, `teamId`, `type`, and `minutes` explicitly; confirm both references exist; store `minutes`, computed `points` equal to the submitted minutes, and `occurredAt` as a new server timestamp.
- Team management approach: Validate a non-empty `name`, preserve `mascot`, default `members` to an empty array, and keep submitted member ObjectIds in the team document.
- Leaderboard approach: Aggregate activity points by team, include team names, sort totals highest first, and assign 1-based ranks.
- Workout suggestions approach: Resolve the user by exact email, derive the first workout focus from the user's fitness goal or most recent activity type, and explain the selection in a `reason`. Return a deliberate 404 when no user matches.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Baseline: 1 passed, 4 failed. Failures mean the `User`, `Team`, `Activity`, and `Workout` schemas do not yet validate required fields. The idempotent seed contract already passes.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Baseline: 0 passed, 4 failed. Activity and team creation return placeholder `501` responses; leaderboard and workout suggestions still use incomplete implementations. A passing run must cover creation/listing, 4xx input failures, ranking, and user-specific suggestions.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Baseline: 0 passed, 15 failed. The capability components do not yet render API data or the required loading, empty, and error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Run after the data and API contracts pass; a pass confirms TypeScript and backend compilation.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Run after the presentation contract passes; a pass confirms TypeScript and Vite production compilation.
